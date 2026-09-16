import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAllowedRole, requiredRolesForPath } from "@/lib/access-control";
import {
  LOGIN_RETURN_COOKIE,
  LOGIN_RETURN_COOKIE_MAX_AGE_SECONDS,
  safeLoginReturnPath,
} from "@/lib/login-return";
import type { Database } from "@/lib/supabase/types";

const PUBLIC_PATHS = new Set(["/login", "/access-denied", "/api/health", "/offline.html"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function privateNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Vary", "Cookie");
  return response;
}

function unauthenticatedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return privateNoStore(NextResponse.json({ error: "Authentication required." }, { status: 401 }));
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  const response = privateNoStore(NextResponse.redirect(loginUrl));
  response.cookies.set({
    name: LOGIN_RETURN_COOKIE,
    value: safeLoginReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
    httpOnly: true,
    maxAge: LOGIN_RETURN_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

function forbiddenResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return privateNoStore(NextResponse.json({ error: "You do not have access to this resource." }, { status: 403 }));
  }

  return privateNoStore(NextResponse.redirect(new URL("/access-denied", request.url)));
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
    return privateNoStore(NextResponse.json({ error: "WMS authentication is not configured." }, { status: 503 }));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    if (isPublicPath(request.nextUrl.pathname)) return response;
    return unauthenticatedResponse(request);
  }

  const { data: profile } = await supabase
    .from("wms_profiles")
    .select("id, is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) {
    if (request.nextUrl.pathname === "/access-denied") return response;
    return forbiddenResponse(request);
  }

  const { data: assignments } = await supabase
    .from("wms_user_roles")
    .select("role_id")
    .eq("user_id", userId);
  const roleIds = assignments?.map((assignment) => assignment.role_id) ?? [];
  if (!roleIds.length) {
    if (request.nextUrl.pathname === "/access-denied") return response;
    return forbiddenResponse(request);
  }
  const { data: roleRows } = roleIds.length
    ? await supabase.from("wms_roles").select("name").in("id", roleIds)
    : { data: [] as Array<{ name: string }> };
  const userRoles = roleRows?.map((role) => role.name) ?? [];

  if (request.nextUrl.pathname === "/login") {
    const redirectResponse = privateNoStore(NextResponse.redirect(new URL("/", request.url)));
    redirectResponse.cookies.delete(LOGIN_RETURN_COOKIE);
    return redirectResponse;
  }

  const allowedRoles = requiredRolesForPath(request.nextUrl.pathname);
  if (!hasAllowedRole(userRoles, allowedRoles)) return forbiddenResponse(request);

  return privateNoStore(response);
}
