import "server-only";

import { cache } from "react";
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

async function loadCurrentWmsAccess(): Promise<WmsAccess | null> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;
  if (claimsError || !userId) return null;

  const { data, error } = await supabase.rpc("wms_current_access");
  const access = data?.[0];
  if (error || !access || access.user_id !== userId || !access.roles.length) return null;

  return {
    userId,
    email: access.email ?? (typeof claims.email === "string" ? claims.email : null),
    fullName: access.full_name,
    defaultWarehouse: access.default_warehouse,
    warehouseScope: access.warehouse_scope,
    roles: access.roles,
  };
}

export const getCurrentWmsAccess = cache(loadCurrentWmsAccess);

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
