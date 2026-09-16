import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function ensure<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null) throw new Error(`${label}: data tidak tersedia`);
  return data;
}

export async function getMasterData() {
  const supabase = await createServerSupabaseClient();
  const [warehouses, locations, materials, stockTypes] = await Promise.all([
    supabase.from("wms_warehouses").select("*").order("warehouse_code"),
    supabase.from("wms_locations").select("*").order("location_code").limit(1000),
    supabase.from("wms_materials").select("*").order("material_code").limit(2000),
    supabase.from("wms_stock_types").select("*").order("code"),
  ]);
  return {
    warehouses: ensure(warehouses.data, warehouses.error, "Warehouse"),
    locations: ensure(locations.data, locations.error, "Lokasi"),
    materials: ensure(materials.data, materials.error, "Material"),
    stockTypes: ensure(stockTypes.data, stockTypes.error, "Tipe stok"),
  };
}

export async function getUserAccessData() {
  const supabase = await createServerSupabaseClient();
  const [profiles, roles, assignments, warehouses] = await Promise.all([
    supabase.from("wms_profiles").select("*").order("created_at"),
    supabase.from("wms_roles").select("*").order("id"),
    supabase.from("wms_user_roles").select("*").order("created_at"),
    supabase.from("wms_warehouses").select("*").order("warehouse_code"),
  ]);
  return {
    profiles: ensure(profiles.data, profiles.error, "Profil"), roles: ensure(roles.data, roles.error, "Role"),
    assignments: ensure(assignments.data, assignments.error, "Role pengguna"), warehouses: ensure(warehouses.data, warehouses.error, "Warehouse"),
  };
}

export async function getInboundData() {
  const supabase = await createServerSupabaseClient();
  const [documents, items, materials, lpns] = await Promise.all([
    supabase.from("wms_inbound_documents").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("wms_inbound_items").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("wms_materials").select("id,material_code,long_description").limit(3000),
    supabase.from("wms_lpns").select("*").order("created_at", { ascending: false }).limit(1000),
  ]);
  return {
    documents: ensure(documents.data, documents.error, "Inbound"), items: ensure(items.data, items.error, "Line inbound"),
    materials: ensure(materials.data, materials.error, "Material inbound"), lpns: ensure(lpns.data, lpns.error, "LPN inbound"),
  };
}

export async function getOutboundData() {
  const supabase = await createServerSupabaseClient();
  const [documents, items, tasks, notes, materials, lpns, locations] = await Promise.all([
    supabase.from("wms_outbound_documents").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("wms_outbound_items").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("wms_picking_tasks").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("wms_delivery_notes").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("wms_materials").select("id,material_code,long_description").limit(3000),
    supabase.from("wms_lpns").select("id,lpn_code,lot_number,qty_current_kg,status,current_location_id").limit(3000),
    supabase.from("wms_locations").select("id,location_code,location_type,warehouse").limit(2000),
  ]);
  return {
    documents: ensure(documents.data, documents.error, "Outbound"), items: ensure(items.data, items.error, "Line outbound"),
    tasks: ensure(tasks.data, tasks.error, "Picking task"), notes: ensure(notes.data, notes.error, "Delivery note"),
    materials: ensure(materials.data, materials.error, "Material outbound"), lpns: ensure(lpns.data, lpns.error, "LPN outbound"),
    locations: ensure(locations.data, locations.error, "Lokasi outbound"),
  };
}

export async function getCycleAndAdjustmentData() {
  const supabase = await createServerSupabaseClient();
  const [sessions, lines, adjustments, lpns, materials, locations] = await Promise.all([
    supabase.from("wms_cycle_count_sessions").select("*").order("opened_at", { ascending: false }).limit(300),
    supabase.from("wms_cycle_count_lines").select("*").order("counted_at", { ascending: false }).limit(3000),
    supabase.from("wms_adjustment_requests").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("wms_lpns").select("id,lpn_code,material_id,current_location_id,qty_current_kg,status").limit(3000),
    supabase.from("wms_materials").select("id,material_code,long_description").limit(3000),
    supabase.from("wms_locations").select("id,location_code,location_type,warehouse,is_active").limit(2000),
  ]);
  return {
    sessions: ensure(sessions.data, sessions.error, "Sesi count"), lines: ensure(lines.data, lines.error, "Line count"),
    adjustments: ensure(adjustments.data, adjustments.error, "Adjustment"), lpns: ensure(lpns.data, lpns.error, "LPN count"),
    materials: ensure(materials.data, materials.error, "Material count"), locations: ensure(locations.data, locations.error, "Lokasi count"),
  };
}

export async function getInventoryWorkspaceData() {
  const supabase = await createServerSupabaseClient();
  const [inventory, batches] = await Promise.all([
    supabase.from("wms_inventory_detail_view").select("*").order("created_at", { ascending: false }).limit(3000),
    supabase.from("wms_inventory_import_batches").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  return { inventory: ensure(inventory.data, inventory.error, "Inventory"), batches: ensure(batches.data, batches.error, "Batch import") };
}

export async function getAuditData() {
  const supabase = await createServerSupabaseClient();
  const [movements, audits, scans, lpns, materials, locations] = await Promise.all([
    supabase.from("wms_stock_movements").select("*").order("movement_date", { ascending: false }).limit(500),
    supabase.from("wms_audit_log").select("*").order("occurred_at", { ascending: false }).limit(500),
    supabase.from("wms_scan_events").select("*").order("scanned_at", { ascending: false }).limit(500),
    supabase.from("wms_lpns").select("id,lpn_code").limit(3000),
    supabase.from("wms_materials").select("id,material_code,long_description").limit(3000),
    supabase.from("wms_locations").select("id,location_code").limit(2000),
  ]);
  return {
    movements: ensure(movements.data, movements.error, "Movement"), audits: ensure(audits.data, audits.error, "Audit"),
    scans: ensure(scans.data, scans.error, "Scan"), lpns: ensure(lpns.data, lpns.error, "LPN audit"),
    materials: ensure(materials.data, materials.error, "Material audit"), locations: ensure(locations.data, locations.error, "Lokasi audit"),
  };
}
