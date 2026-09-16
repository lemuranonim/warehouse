import {
  deliveryNotes,
  inboundDocuments,
  outboundOrders,
  type DeliveryNote,
  type InboundDocument,
} from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WarehouseDocumentLine = {
  lineNo: number;
  materialCode: string;
  materialDescription: string;
  lotNumber: string;
  qtyKg: number;
  uom: "KG";
  remark: string;
};

export type DocumentSignoff = {
  role: "Warehouse In-Charge" | "Transporter" | "Receiver" | "Data Entry Receiving";
  name: string;
  date: string;
};

export type WarehouseDocument = {
  kind: "incoming" | "delivery";
  title: "INCOMING NOTE" | "DELIVERY NOTE";
  docNo: string;
  documentDate: string;
  fromParty: string;
  toParty: string;
  address: string;
  truckId: string;
  preparedBy: string;
  doNo: string;
  lines: WarehouseDocumentLine[];
  totalQtyKg: number;
  linePrecision: number;
  totalPrecision: number;
  signoffs: DocumentSignoff[];
  documentControl: {
    documentNo: string;
    edition: string;
    revision: string;
    effectiveDate: string;
    copies: string[];
  };
};

const documentControl = {
  documentNo: "PK-WHS-01-F1",
  edition: "02",
  revision: "00",
  effectiveDate: "01.09.2023",
  copies: ["Admin", "Receiver", "Transporter", "Sender", "Archive"],
};

function formatDocumentDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date).replaceAll(" ", "-");
}

export function buildIncomingReport(source: InboundDocument): WarehouseDocument {
  const documentDate = formatDocumentDate(source.asnDate);
  const lines = source.lines.map((line) => ({
    lineNo: line.lineNo,
    materialCode: line.materialCode,
    materialDescription: line.materialDescription,
    lotNumber: line.lotNumber,
    qtyKg: line.receivedQtyKg > 0 ? line.receivedQtyKg : line.expectedQtyKg,
    uom: "KG" as const,
    remark: line.status === "variance" ? "Qty variance" : "-",
  }));

  return {
    kind: "incoming",
    title: "INCOMING NOTE",
    docNo: source.docNo,
    documentDate,
    fromParty: source.supplier,
    toParty: "Advanta Seeds Warehouse",
    address: "-",
    truckId: "-",
    preparedBy: source.createdBy,
    doNo: source.docNo,
    lines,
    totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0),
    linePrecision: 2,
    totalPrecision: 2,
    signoffs: [
      { role: "Warehouse In-Charge", name: "-", date: documentDate },
      { role: "Transporter", name: "-", date: documentDate },
      { role: "Receiver", name: "-", date: documentDate },
      { role: "Data Entry Receiving", name: source.createdBy, date: documentDate },
    ],
    documentControl,
  };
}

export function buildDeliveryReport(source: DeliveryNote): WarehouseDocument {
  const documentDate = formatDocumentDate(source.dnDate);
  const outbound = outboundOrders.find((order) => order.docNo === source.outboundDocNo);
  const lines = source.lines.map((line, index) => ({
    lineNo: index + 1,
    materialCode: line.materialCode,
    materialDescription: line.materialDescription,
    lotNumber: line.lotNumber,
    qtyKg: line.qtyKg,
    uom: "KG" as const,
    remark: line.status,
  }));

  return {
    kind: "delivery",
    title: "DELIVERY NOTE",
    docNo: source.dnNo,
    documentDate,
    fromParty: "Advanta Seeds Warehouse",
    toParty: source.destination,
    address: "-",
    truckId: source.vehicle,
    preparedBy: outbound?.createdBy ?? "-",
    doNo: source.outboundDocNo,
    lines,
    totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0),
    linePrecision: 2,
    totalPrecision: 2,
    signoffs: [
      { role: "Warehouse In-Charge", name: "-", date: documentDate },
      { role: "Transporter", name: source.driver, date: documentDate },
      { role: "Receiver", name: "-", date: documentDate },
      { role: "Data Entry Receiving", name: outbound?.createdBy ?? "-", date: documentDate },
    ],
    documentControl,
  };
}

export async function getWarehouseReport(kind: WarehouseDocument["kind"], docNo: string): Promise<WarehouseDocument | undefined> {
  if (process.env.NEXT_PUBLIC_WMS_DATA_MODE !== "live") {
    if (kind === "incoming") {
      const source = inboundDocuments.find((document) => document.docNo === docNo);
      return source ? buildIncomingReport(source) : undefined;
    }
    const source = deliveryNotes.find((document) => document.dnNo === docNo);
    return source ? buildDeliveryReport(source) : undefined;
  }

  const supabase = await createServerSupabaseClient();
  if (kind === "incoming") {
    const { data: source } = await supabase.from("wms_inbound_documents").select("*").eq("doc_no", docNo).maybeSingle();
    if (!source) return undefined;
    const [{ data: itemRows }, { data: materialRows }, { data: profile }] = await Promise.all([
      supabase.from("wms_inbound_items").select("*").eq("inbound_doc_id", source.id).order("line_no"),
      supabase.from("wms_materials").select("id,material_code,long_description"),
      source.created_by ? supabase.from("wms_profiles").select("full_name").eq("id", source.created_by).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const materialById = new Map((materialRows ?? []).map(row => [row.id, row]));
    const lines = (itemRows ?? []).map((row, index) => ({ lineNo: row.line_no ?? index + 1, materialCode: materialById.get(row.material_id)?.material_code ?? "-", materialDescription: row.source_description ?? materialById.get(row.material_id)?.long_description ?? "-", lotNumber: row.lot_number, qtyKg: Number(row.received_qty_kg || row.planned_qty_kg), uom: "KG" as const, remark: row.remark ?? "-" }));
    const documentDate = formatDocumentDate(source.document_date ?? source.created_at.slice(0, 10));
    return { kind, title: "INCOMING NOTE", docNo: source.doc_no, documentDate, fromParty: source.sender ?? "-", toParty: source.destination ?? "Advanta Seeds Warehouse", address: source.address ?? "-", truckId: source.truck_id ?? "-", preparedBy: source.prepared_by_name ?? profile?.full_name ?? "-", doNo: source.do_no ?? source.doc_no, lines, totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0), linePrecision: 3, totalPrecision: 3, signoffs: [
      { role: "Warehouse In-Charge", name: "-", date: documentDate }, { role: "Transporter", name: "-", date: documentDate }, { role: "Receiver", name: "-", date: documentDate }, { role: "Data Entry Receiving", name: source.prepared_by_name ?? "-", date: documentDate },
    ], documentControl: { ...documentControl, documentNo: source.form_document_no ?? documentControl.documentNo, edition: source.edition_no ?? documentControl.edition, revision: source.revision_no ?? documentControl.revision, effectiveDate: source.effective_date ?? documentControl.effectiveDate } };
  }

  const { data: note } = await supabase.from("wms_delivery_notes").select("*").eq("dn_no", docNo).maybeSingle();
  if (!note) return undefined;
  const { data: outbound } = await supabase.from("wms_outbound_documents").select("*").eq("id", note.outbound_doc_id).maybeSingle();
  if (!outbound) return undefined;
  const [{ data: itemRows }, { data: taskRows }, { data: lpnRows }, { data: materialRows }] = await Promise.all([
    supabase.from("wms_outbound_items").select("*").eq("outbound_doc_id", outbound.id).order("line_no"),
    supabase.from("wms_picking_tasks").select("*"), supabase.from("wms_lpns").select("id,material_id,lot_number"),
    supabase.from("wms_materials").select("id,material_code,long_description"),
  ]);
  const items = itemRows ?? []; const itemIds = new Set(items.map(row => row.id)); const tasks = (taskRows ?? []).filter(row => itemIds.has(row.outbound_item_id));
  const lpnById = new Map((lpnRows ?? []).map(row => [row.id, row])); const materialById = new Map((materialRows ?? []).map(row => [row.id, row]));
  const lines = tasks.map((task, index) => { const lpn = lpnById.get(task.picked_lpn_id ?? task.lpn_id); const material = lpn ? materialById.get(lpn.material_id) : undefined; return { lineNo: index + 1, materialCode: material?.material_code ?? "-", materialDescription: material?.long_description ?? "-", lotNumber: lpn?.lot_number ?? "-", qtyKg: Number(task.qty_kg), uom: "KG" as const, remark: task.status }; });
  const documentDate = formatDocumentDate(note.document_date ?? note.created_at.slice(0,10));
  return { kind, title: "DELIVERY NOTE", docNo: note.dn_no, documentDate, fromParty: note.origin ?? outbound.origin ?? "Advanta Seeds Warehouse", toParty: note.destination ?? outbound.destination ?? "-", address: note.address ?? outbound.address ?? "-", truckId: note.truck_id ?? outbound.truck_id ?? "-", preparedBy: note.prepared_by_name ?? outbound.prepared_by_name ?? "-", doNo: outbound.do_no ?? outbound.doc_no, lines, totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0), linePrecision: 3, totalPrecision: 3, signoffs: [
    { role: "Warehouse In-Charge", name: "-", date: documentDate }, { role: "Transporter", name: "-", date: documentDate }, { role: "Receiver", name: "-", date: documentDate }, { role: "Data Entry Receiving", name: note.prepared_by_name ?? "-", date: documentDate },
  ], documentControl: { ...documentControl, documentNo: note.form_document_no ?? documentControl.documentNo, edition: note.edition_no ?? documentControl.edition, revision: note.revision_no ?? documentControl.revision, effectiveDate: note.effective_date ?? documentControl.effectiveDate } };
}
