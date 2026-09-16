export const WMS_ROLES = [
  "Admin",
  "Checker",
  "Operator Forklift",
  "Supervisor",
  "WH Advanta Viewer",
] as const;

export type WmsRole = (typeof WMS_ROLES)[number];

export const ADMIN_ROLES: WmsRole[] = ["Admin"];
export const CHECKER_ROLES: WmsRole[] = ["Admin", "Checker", "Supervisor"];
export const OPERATOR_ROLES: WmsRole[] = ["Admin", "Operator Forklift", "Supervisor"];
export const SUPERVISOR_ROLES: WmsRole[] = ["Admin", "Supervisor"];
export const INVENTORY_IMPORT_ROLES: WmsRole[] = ["Admin", "Supervisor"];

export function requiredRolesForPath(pathname: string): WmsRole[] | null {
  if (pathname.startsWith("/admin/inventory") || pathname.startsWith("/admin/audit") || pathname.startsWith("/admin/outbound")) {
    return SUPERVISOR_ROLES;
  }
  if (pathname.startsWith("/admin")) return ADMIN_ROLES;
  if (pathname.startsWith("/checker")) return CHECKER_ROLES;
  if (pathname.startsWith("/operator/scan") || pathname.startsWith("/operator/lookup")) return null;
  if (pathname.startsWith("/operator")) return OPERATOR_ROLES;
  if (pathname.startsWith("/supervisor")) return SUPERVISOR_ROLES;
  return null;
}

export function hasAllowedRole(userRoles: readonly string[], allowedRoles: readonly WmsRole[] | null) {
  return allowedRoles === null || allowedRoles.some((role) => userRoles.includes(role));
}
