import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0003_production_security_hardening.sql"),
  "utf8",
).toLowerCase();

describe("production database hardening migration", () => {
  it("removes anonymous WMS privileges", () => {
    expect(migration).toContain("revoke all privileges on table");
    expect(migration).toContain("revoke execute on function public.wms_putaway_lpn(text, text, text) from public, anon");
  });

  it("requires active WMS membership and warehouse scope", () => {
    expect(migration).toContain("p.is_active = true");
    expect(migration).toContain("wms_has_warehouse_access");
    expect(migration).toContain("wms_sync_queue_active_member_own");
  });

  it("preserves the existing numeric type when replacing the stock view", () => {
    expect(migration).toContain("l.qty_current_kg::numeric as qty_current_kg");
  });

  it("pins the search path on privileged functions", () => {
    const functionHeaders = migration
      .split("create or replace function")
      .slice(1)
      .map((definition) => definition.split("as $$")[0]);
    const privilegedHeaders = functionHeaders.filter((header) => header.includes("security definer"));
    expect(privilegedHeaders.length).toBeGreaterThan(0);
    expect(privilegedHeaders.every((header) => header.includes("set search_path = ''"))).toBe(true);
  });
});
