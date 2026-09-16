export const WMS_REALTIME_TABLES = [
  "wms_materials",
  "wms_stock_types",
  "wms_warehouses",
  "wms_locations",
  "wms_lpns",
  "wms_stock_movements",
  "wms_inbound_documents",
  "wms_inbound_items",
  "wms_outbound_documents",
  "wms_outbound_items",
  "wms_picking_tasks",
  "wms_delivery_notes",
  "wms_cycle_count_sessions",
  "wms_cycle_count_lines",
  "wms_adjustment_requests",
  "wms_inventory_import_batches",
  "wms_scan_events",
  "wms_audit_log",
] as const;

export type WmsRealtimeTable = (typeof WMS_REALTIME_TABLES)[number];

const DASHBOARD_TABLES: readonly WmsRealtimeTable[] = [
  "wms_lpns",
  "wms_stock_movements",
  "wms_inbound_documents",
  "wms_outbound_documents",
  "wms_materials",
  "wms_locations",
];

const routeSubscriptions: Array<{ prefix: string; tables: readonly WmsRealtimeTable[] }> = [
  { prefix: "/admin/materials", tables: ["wms_materials"] },
  { prefix: "/admin/stock-types", tables: ["wms_stock_types"] },
  { prefix: "/admin/locations", tables: ["wms_warehouses", "wms_locations"] },
  { prefix: "/admin/users", tables: ["wms_warehouses"] },
  { prefix: "/admin/inbound", tables: ["wms_inbound_documents", "wms_inbound_items", "wms_materials", "wms_stock_types"] },
  { prefix: "/checker/receiving", tables: ["wms_inbound_documents", "wms_inbound_items", "wms_materials", "wms_lpns"] },
  { prefix: "/admin/outbound", tables: ["wms_outbound_documents", "wms_outbound_items", "wms_picking_tasks", "wms_delivery_notes", "wms_materials"] },
  { prefix: "/operator/picking", tables: ["wms_outbound_documents", "wms_outbound_items", "wms_picking_tasks", "wms_lpns", "wms_locations"] },
  { prefix: "/operator/staging", tables: ["wms_outbound_documents", "wms_outbound_items", "wms_picking_tasks", "wms_lpns", "wms_locations"] },
  { prefix: "/checker/shipping", tables: ["wms_outbound_documents", "wms_outbound_items", "wms_picking_tasks", "wms_delivery_notes"] },
  { prefix: "/admin/inventory", tables: ["wms_inventory_import_batches"] },
  { prefix: "/admin/labels", tables: ["wms_lpns", "wms_materials", "wms_locations"] },
  { prefix: "/admin/audit", tables: ["wms_stock_movements", "wms_audit_log", "wms_scan_events", "wms_lpns", "wms_materials", "wms_locations"] },
  { prefix: "/operator/cycle-count", tables: ["wms_cycle_count_sessions", "wms_cycle_count_lines", "wms_lpns", "wms_materials", "wms_locations"] },
  { prefix: "/supervisor/adjustments", tables: ["wms_adjustment_requests", "wms_lpns", "wms_materials", "wms_locations"] },
  { prefix: "/operator/putaway", tables: ["wms_lpns", "wms_materials", "wms_locations", "wms_stock_movements"] },
  { prefix: "/operator/lookup", tables: ["wms_lpns", "wms_materials", "wms_locations", "wms_stock_movements"] },
  { prefix: "/operator/scan", tables: ["wms_lpns", "wms_locations", "wms_picking_tasks", "wms_stock_movements"] },
  { prefix: "/documents/incoming", tables: ["wms_inbound_documents", "wms_inbound_items", "wms_materials", "wms_lpns"] },
  { prefix: "/documents/delivery", tables: ["wms_outbound_documents", "wms_outbound_items", "wms_delivery_notes", "wms_picking_tasks"] },
  { prefix: "/viewer", tables: DASHBOARD_TABLES },
  { prefix: "/admin", tables: DASHBOARD_TABLES },
  { prefix: "/", tables: DASHBOARD_TABLES },
];

export function realtimeTablesForPath(pathname: string): readonly WmsRealtimeTable[] {
  const match = routeSubscriptions.find(({ prefix }) => (
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
  return match?.tables ?? [];
}
