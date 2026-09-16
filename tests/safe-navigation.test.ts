import { describe, expect, it } from "vitest";
import { safeInternalPath } from "../lib/safe-navigation";

describe("post-login navigation", () => {
  it("preserves a local route and query", () => {
    expect(safeInternalPath("/admin/inventory?tab=import")).toBe("/admin/inventory?tab=import");
  });

  it("rejects absolute, protocol-relative, and backslash redirects", () => {
    expect(safeInternalPath("https://example.com")).toBe("/");
    expect(safeInternalPath("//example.com")).toBe("/");
    expect(safeInternalPath("/\\example.com")).toBe("/");
  });

  it("rejects an encoded protocol-relative path", () => {
    expect(safeInternalPath("/%2f%2fexample.com")).toBe("/");
  });
});
