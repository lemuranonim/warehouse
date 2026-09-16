import { describe, expect, it } from "vitest";
import {
  hasAllowedRole,
  requiredRolesForPath,
} from "../lib/access-control";

describe("warehouse route access", () => {
  it("keeps admin masters limited to administrators", () => {
    expect(requiredRolesForPath("/admin/materials")).toEqual(["Admin"]);
    expect(hasAllowedRole(["Supervisor"], requiredRolesForPath("/admin/materials"))).toBe(false);
  });

  it("allows supervisors to review inventory and audit routes", () => {
    expect(hasAllowedRole(["Supervisor"], requiredRolesForPath("/admin/inventory"))).toBe(true);
    expect(hasAllowedRole(["Supervisor"], requiredRolesForPath("/admin/audit"))).toBe(true);
  });

  it("keeps operational transactions role-scoped", () => {
    expect(hasAllowedRole(["Checker"], requiredRolesForPath("/operator/putaway"))).toBe(false);
    expect(hasAllowedRole(["Operator Forklift"], requiredRolesForPath("/operator/putaway"))).toBe(true);
    expect(hasAllowedRole(["WH Advanta Viewer"], requiredRolesForPath("/operator/scan"))).toBe(true);
  });
});
