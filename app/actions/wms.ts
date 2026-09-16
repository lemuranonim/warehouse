"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { WmsActionState } from "@/components/wms-action-form";
import {
  ADMIN_ROLES,
  CHECKER_ROLES,
  OPERATOR_ROLES,
  SUPERVISOR_ROLES,
} from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const affectedPaths = [
  "/", "/admin", "/admin/materials", "/admin/locations", "/admin/stock-types",
  "/admin/users", "/admin/inbound", "/admin/outbound", "/admin/inventory",
  "/admin/labels", "/admin/audit", "/checker/receiving", "/checker/shipping",
  "/operator/picking", "/operator/staging", "/operator/cycle-count",
  "/operator/lookup", "/supervisor/adjustments", "/viewer",
];

function success(message: string): WmsActionState {
  for (const path of affectedPaths) revalidatePath(path);
  return { status: "success", message };
}

function failure(error: unknown): WmsActionState {
  const technicalMessage = error instanceof Error ? error.message : "Unknown WMS action error";
  console.error("[wms-action]", technicalMessage);
  const safeBusinessError = /(wajib|tidak valid|terlalu panjang|harus|tidak ditemukan|not found|not ready|cannot|exceeds|insufficient|already exists|blocked|pending|too many workflow requests|warehouse access denied|role is not authorized|mode live belum aktif|between 1 and 100)/i.test(technicalMessage);
  return {
    status: "error",
    message: safeBusinessError
      ? technicalMessage.replaceAll("_", " ").slice(0, 240)
      : "Operasi tidak dapat diproses. Muat ulang data dan coba kembali; hubungi administrator jika masalah berulang.",
  };
}

function text(formData: FormData, key: string, max = 200) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > max) throw new Error(`${key} terlalu panjang.`);
  return value;
}

function required(formData: FormData, key: string, max = 200) {
  const value = text(formData, key, max);
  if (!value) throw new Error(`${key} wajib diisi.`);
  return value;
}

function numberValue(formData: FormData, key: string, minimum = 0) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value < minimum) throw new Error(`${key} tidak valid.`);
  return value;
}

function requestKey(prefix: string) {
  return `${prefix}:${randomUUID()}`;
}

function documentItems(formData: FormData, kind: "inbound" | "outbound") {
  const raw = required(formData, "items_json", 100_000);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Daftar line tidak valid."); }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) throw new Error("Dokumen harus memiliki 1–100 line.");
  return parsed.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Line ${index + 1} tidak valid.`);
    const item = value as Record<string, unknown>;
    const materialCode = String(item.material_code ?? "").trim();
    const lotNumber = String(item.lot_number ?? "").trim();
    const qty = Number(kind === "inbound" ? item.planned_qty_kg : item.requested_qty_kg);
    if (!materialCode || materialCode.length > 80) throw new Error(`Material line ${index + 1} tidak valid.`);
    if (kind === "inbound" && (!lotNumber || lotNumber.length > 120)) throw new Error(`Lot line ${index + 1} wajib diisi.`);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Qty line ${index + 1} harus lebih besar dari nol.`);
    return kind === "inbound" ? {
      line_no: index + 1, material_code: materialCode, lot_number: lotNumber,
      planned_qty_kg: qty, exp_date: String(item.exp_date ?? "").trim().slice(0, 10) || null,
      stock_type: String(item.stock_type || "Fresh Seed").slice(0, 80),
      remark: String(item.remark || "").slice(0, 300) || null, uom: "KG",
    } : {
      line_no: index + 1, material_code: materialCode, lot_number: lotNumber || null,
      requested_qty_kg: qty, remark: String(item.remark || "").slice(0, 300) || null, uom: "KG",
    };
  });
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function assertLiveMode() {
  if (process.env.NEXT_PUBLIC_WMS_DATA_MODE !== "live") {
    throw new Error("Mode live belum aktif. Transaksi diblokir untuk mencegah perubahan data demo.");
  }
}

export async function saveWarehouseAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_upsert_warehouse", {
      warehouse_code: required(formData, "warehouse_code", 50),
      warehouse_name: required(formData, "warehouse_name", 120),
      site_name: text(formData, "site_name", 120) || null,
      active: formData.get("active") !== "false",
    });
    throwIfError(error); return success("Warehouse tersimpan.");
  } catch (error) { return failure(error); }
}

export async function saveLocationAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const capacityRaw = text(formData, "capacity_kg");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_upsert_location", {
      location_code: required(formData, "location_code", 80),
      warehouse_code: required(formData, "warehouse_code", 50),
      location_type: required(formData, "location_type", 30),
      capacity_kg: capacityRaw ? numberValue(formData, "capacity_kg", 0.001) : null,
      site_name: text(formData, "site_name", 120) || null,
      room_name: text(formData, "room_name", 80) || null,
      aisle_name: text(formData, "aisle_name", 50) || null,
      rack_name: text(formData, "rack_name", 50) || null,
      level_name: text(formData, "level_name", 50) || null,
      bin_name: text(formData, "bin_name", 50) || null,
      active: true,
    });
    throwIfError(error); return success("Lokasi dan token scan tersimpan.");
  } catch (error) { return failure(error); }
}

export async function saveMaterialAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_upsert_material", {
      material_code: required(formData, "material_code", 80),
      material_description: required(formData, "material_description", 250),
      hybrid_name: text(formData, "hybrid", 100) || null,
      stage_name: text(formData, "stage", 100) || null,
      flagging_name: text(formData, "flagging", 100) || null,
      material_type: text(formData, "material_type", 100) || null,
      product_name: text(formData, "product", 100) || null,
      crop_name: text(formData, "crop", 100) || null,
      material_status: text(formData, "status", 30) || "active",
      order_unit_name: text(formData, "order_unit", 20) || "KG",
      package_kg: numberValue(formData, "package_kg", 0),
      active: true,
    });
    throwIfError(error); return success("Material tersimpan.");
  } catch (error) { return failure(error); }
}

export async function saveStockTypeAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_upsert_stock_type", {
      stock_code: required(formData, "stock_code", 10).toUpperCase(),
      stock_label: required(formData, "stock_label", 100),
      stock_description: text(formData, "stock_description", 300) || null,
      stock_color: text(formData, "stock_color", 20) || "blue",
      active: true,
    });
    throwIfError(error); return success("Tipe stok tersimpan.");
  } catch (error) { return failure(error); }
}

export async function setUserAccessAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const email = required(formData, "user_email", 254).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email tidak valid.");
    const scopes = text(formData, "warehouse_codes", 500).split(",").map((value) => value.trim()).filter(Boolean);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_set_profile_access", {
      user_email: email,
      profile_name: required(formData, "profile_name", 150),
      role_name: required(formData, "role_name", 80),
      default_warehouse_code: text(formData, "default_warehouse", 50) || null,
      warehouse_codes: scopes.length ? scopes : ["All"],
      active: formData.get("active") !== "false",
    });
    throwIfError(error); return success("Akses pengguna tersimpan. Role tambahan tidak menghapus role yang sudah ada.");
  } catch (error) { return failure(error); }
}

export async function createInboundAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(ADMIN_ROLES);
    const items = documentItems(formData, "inbound");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_create_inbound", {
      doc_no: required(formData, "doc_no", 80), sender_name: text(formData, "sender", 180) || null,
      document_date: text(formData, "document_date", 10) || null,
      destination_name: text(formData, "destination", 180) || null,
      items, idempotency_key: requestKey("inbound"),
    });
    throwIfError(error); return success("ASN inbound dibuat dan siap diverifikasi checker.");
  } catch (error) { return failure(error); }
}

export async function receiveInboundAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(CHECKER_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_receive_inbound_item", {
      inbound_item_id: required(formData, "inbound_item_id", 40),
      actual_qty_kg: numberValue(formData, "actual_qty_kg", 0.001),
      lpn_code: text(formData, "lpn_code", 100) || null,
      idempotency_key: requestKey("receive"),
    });
    throwIfError(error); return success("Penerimaan diposting, LPN dan token scan sudah dibuat.");
  } catch (error) { return failure(error); }
}

export async function createOutboundAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const items = documentItems(formData, "outbound");
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_create_outbound", {
      doc_no: required(formData, "doc_no", 80), destination_name: text(formData, "destination", 180) || null,
      document_date: text(formData, "document_date", 10) || null,
      origin_name: text(formData, "origin", 180) || null,
      items, idempotency_key: requestKey("outbound"),
    });
    throwIfError(error); return success("Order outbound dibuat dan siap dialokasikan.");
  } catch (error) { return failure(error); }
}

export async function allocateOutboundAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_allocate_outbound", { outbound_document_id: required(formData, "outbound_document_id", 40), idempotency_key: requestKey("allocate") });
    throwIfError(error); return success("Stok dialokasikan FEFO dan picking task dibuat.");
  } catch (error) { return failure(error); }
}

export async function pickTaskAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(OPERATOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_pick_task", { picking_task_id: required(formData, "picking_task_id", 40), idempotency_key: requestKey("pick") });
    throwIfError(error); return success("Picking dikonfirmasi. Split LPN dibuat otomatis bila diperlukan.");
  } catch (error) { return failure(error); }
}

export async function stageTaskAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(OPERATOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_stage_task", { picking_task_id: required(formData, "picking_task_id", 40), staging_location_code: required(formData, "staging_location_code", 80), idempotency_key: requestKey("stage") });
    throwIfError(error); return success("LPN dipindahkan ke staging.");
  } catch (error) { return failure(error); }
}

export async function createDeliveryNoteAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(CHECKER_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_create_delivery_note", { outbound_document_id: required(formData, "outbound_document_id", 40), delivery_note_no: required(formData, "delivery_note_no", 80), idempotency_key: requestKey("dn") });
    throwIfError(error); return success("Delivery note dibuat dan siap dispatch.");
  } catch (error) { return failure(error); }
}

export async function dispatchOutboundAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(CHECKER_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_dispatch_outbound", { outbound_document_id: required(formData, "outbound_document_id", 40), idempotency_key: requestKey("dispatch") });
    throwIfError(error); return success("Dispatch selesai dan saldo stok sudah dikurangi.");
  } catch (error) { return failure(error); }
}

export async function openCycleCountAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_open_cycle_count", { location_id: required(formData, "location_id", 40) });
    throwIfError(error); return success("Sesi cycle count dibuka dari saldo terkunci saat ini.");
  } catch (error) { return failure(error); }
}

export async function submitCycleCountAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(OPERATOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_submit_cycle_count", { cycle_count_line_id: required(formData, "cycle_count_line_id", 40), actual_qty_kg: numberValue(formData, "actual_qty_kg", 0) });
    throwIfError(error); return success("Hasil hitung aktual disimpan.");
  } catch (error) { return failure(error); }
}

export async function reviewCycleCountAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_review_cycle_count", { cycle_count_session_id: required(formData, "cycle_count_session_id", 40), approve: formData.get("decision") === "approve", idempotency_key: requestKey("cycle-review") });
    throwIfError(error); return success("Cycle count ditinjau dan ledger diperbarui bila disetujui.");
  } catch (error) { return failure(error); }
}

export async function requestAdjustmentAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(OPERATOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_request_adjustment", { lpn_token: required(formData, "lpn_token", 200), target_qty_kg: numberValue(formData, "target_qty_kg", 0), reason_code: required(formData, "reason_code", 50), note: text(formData, "note", 500) || null });
    throwIfError(error); return success("Permintaan penyesuaian diajukan ke supervisor.");
  } catch (error) { return failure(error); }
}

export async function reviewAdjustmentAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_review_adjustment", { adjustment_request_id: required(formData, "adjustment_request_id", 40), approve: formData.get("decision") === "approve", idempotency_key: requestKey("adjustment-review") });
    throwIfError(error); return success("Permintaan penyesuaian telah ditinjau.");
  } catch (error) { return failure(error); }
}

export async function postInventoryBatchAction(_: WmsActionState, formData: FormData): Promise<WmsActionState> {
  try {
    assertLiveMode(); await requirePageAccess(SUPERVISOR_ROLES);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("wms_post_inventory_batch", { inventory_batch_id: required(formData, "inventory_batch_id", 40), idempotency_key: requestKey("inventory-post") });
    throwIfError(error); return success("Batch inventory diposting ke ledger WMS.");
  } catch (error) { return failure(error); }
}
