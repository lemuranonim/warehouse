import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "0007_query_performance.sql"),
  "utf8",
).toLowerCase();

describe("query performance migration", () => {
  it("returns the active user's access in one protected database call", () => {
    expect(migration).toContain("function public.wms_current_access()");
    expect(migration).toContain("profile.id = auth.uid()");
    expect(migration).toContain("profile.is_active = true");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("grant execute on function public.wms_current_access() to authenticated");
  });

  it("indexes newest-first operational queries", () => {
    for (const index of [
      "wms_inbound_documents_created_at_idx",
      "wms_outbound_documents_created_at_idx",
      "wms_picking_tasks_status_created_at_idx",
      "wms_stock_movements_movement_date_idx",
      "wms_scan_events_scanned_at_idx",
      "wms_audit_log_occurred_at_idx",
    ]) expect(migration).toContain(index);
  });

  it("publishes stock-type and audit changes for their live screens", () => {
    expect(migration).toContain("array['wms_stock_types', 'wms_audit_log']");
    expect(migration).toContain("alter publication supabase_realtime add table");
  });
});
