import { ClipboardCheck } from "lucide-react";
import { receiveInboundAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getReceivingData } from "@/lib/wms-queries";

export default async function ReceivingPage() {
  const { documents, items, materials, lpns } = await getReceivingData();
  const materialById = new Map(materials.map(material => [material.id, material]));
  const docById = new Map(documents.map(doc => [doc.id, doc]));
  const openItems = items.filter(item => Number(item.received_qty_kg ?? 0) < Number(item.planned_qty_kg));
  const rows = items.map(item => ({ ...item, material: materialById.get(item.material_id), doc: docById.get(item.inbound_doc_id) }));
  return <div className="page">
    <PageHeader eyebrow="Goods receiving · live" icon={ClipboardCheck} title="Verifikasi Penerimaan" description="Konfirmasi kuantitas aktual per line. Sistem membuat LPN, token QR, lot, dan movement inbound atomik." />
    <section className="section"><WmsActionForm action={receiveInboundAction} submitLabel="Post Penerimaan">
      <label className="wms-field wide"><span>Line ASN *</span><select name="inbound_item_id" required><option value="">Pilih line</option>{openItems.map(item => { const m = materialById.get(item.material_id); const d = docById.get(item.inbound_doc_id); return <option key={item.id} value={item.id}>{d?.doc_no} · {m?.material_code} · {item.lot_number} · sisa {formatKg(item.planned_qty_kg - (item.received_qty_kg ?? 0))} KG</option>; })}</select></label>
      <label className="wms-field"><span>Qty Aktual KG *</span><input min="0.001" name="actual_qty_kg" required step="0.001" type="number" /></label>
      <label className="wms-field"><span>LPN Code (opsional)</span><input name="lpn_code" placeholder="Otomatis bila kosong" /></label>
    </WmsActionForm></section>
    <section className="section"><DataTable columns={[
      { key: "doc", header: "ASN", render: row => <span className="mono-strong">{row.doc?.doc_no ?? "-"}</span> },
      { key: "material", header: "Material", render: row => row.material?.long_description ?? "-" },
      { key: "lot", header: "Lot", render: row => <span className="lot-code">{row.lot_number}</span> },
      { key: "planned", header: "Planned", render: row => `${formatKg(row.planned_qty_kg)} KG` },
      { key: "actual", header: "Received", render: row => `${formatKg(row.received_qty_kg ?? 0)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={rows} emptyMessage="Tidak ada ASN untuk diterima." /></section>
    <section className="section"><div className="section-header"><h2 className="section-title">LPN penerimaan terbaru</h2></div><DataTable columns={[
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn_code}</span> },
      { key: "lot", header: "Lot", render: row => row.lot_number },
      { key: "qty", header: "Saldo", render: row => `${formatKg(row.qty_current_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={lpns.slice(0,50)} /></section>
  </div>;
}
