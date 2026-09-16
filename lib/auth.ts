import "server-only";

import { redirect } from "next/navigation";
import { hasAllowedRole, type WmsRole } from "@/lib/access-control";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WmsAccess = {
  userId: string;
  email: string | null;
  fullName: string | null;
  defaultWarehouse: string | null;
  warehouseScope: string[];
  roles: string[];
};

export async function getCurrentWmsAccess(): Promise<WmsAccess | null> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;
  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("wms_profiles")
    .select("id, full_name, default_warehouse, warehouse_scope, is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (profileError || !profile) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("wms_user_roles")
    .select("role_id")
    .eq("user_id", userId);
  if (assignmentsError) return null;

  const roleIds = assignments?.map((assignment) => assignment.role_id) ?? [];
  if (!roleIds.length) return null;
  const { data: roleRows, error: rolesError } = roleIds.length
    ? await supabase.from("wms_roles").select("name").in("id", roleIds)
    : { data: [] as Array<{ name: string }>, error: null };
  if (rolesError) return null;
  if (!roleRows?.length) return null;

  return {
    userId,
    email: typeof claims.email === "string" ? claims.email : null,
    fullName: profile.full_name,
    defaultWarehouse: profile.default_warehouse,
    warehouseScope: profile.warehouse_scope,
    roles: roleRows?.map((role) => role.name) ?? [],
  };
}

export async function requirePageAccess(allowedRoles: readonly WmsRole[] | null = null) {
  const access = await getCurrentWmsAccess();
  if (!access) redirect("/login");
  if (!hasAllowedRole(access.roles, allowedRoles)) redirect("/access-denied");
  return access;
}

export async function authorizeApi(allowedRoles: readonly WmsRole[] | null = null) {
  const access = await getCurrentWmsAccess();
  if (!access) return { ok: false as const, status: 401 as const, access: null };
  if (!hasAllowedRole(access.roles, allowedRoles)) {
    return { ok: false as const, status: 403 as const, access };
  }
  return { ok: true as const, status: 200 as const, access };
}
