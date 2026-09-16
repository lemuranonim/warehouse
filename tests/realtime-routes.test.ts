import { describe, expect, it } from "vitest";
import { realtimeTablesForPath } from "../lib/realtime-routes";

describe("route-scoped realtime subscriptions", () => {
  it("subscribes material master only to material changes", () => {
    expect(realtimeTablesForPath("/admin/materials")).toEqual(["wms_materials"]);
  });

  it("keeps operational outbound dependencies in sync", () => {
    expect(realtimeTablesForPath("/operator/picking")).toEqual(expect.arrayContaining([
      "wms_outbound_documents",
      "wms_outbound_items",
      "wms_picking_tasks",
      "wms_lpns",
    ]));
  });

  it("does not open database subscriptions on public auth pages", () => {
    expect(realtimeTablesForPath("/login")).toEqual([]);
    expect(realtimeTablesForPath("/access-denied")).toEqual([]);
  });
});
