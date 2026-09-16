import { describe, expect, it } from "vitest";
import { safeLoginReturnPath } from "../lib/login-return";

describe("clean login return navigation", () => {
  it("preserves a protected local route and query", () => {
    expect(safeLoginReturnPath("/admin/inventory?tab=import")).toBe("/admin/inventory?tab=import");
  });

  it("falls back to the dashboard when the cookie is absent", () => {
    expect(safeLoginReturnPath(undefined)).toBe("/");
  });

  it("rejects an external or protocol-relative cookie value", () => {
    expect(safeLoginReturnPath("https://example.com/steal-session")).toBe("/");
    expect(safeLoginReturnPath("//example.com/steal-session")).toBe("/");
  });
});
