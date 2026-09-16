import { Truck } from "lucide-react";
import { allocateOutboundAction, createOutboundAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { DocumentWorkflowForm } from "@/components/document-workflow-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getMasterData, getOutboundData } from "@/lib/wms-queries";

export default async function OutboundPage() {
  const [{ documents, items, tasks, notes, materials }, { warehouses }] = await Promise.all([getOutboundData(), getMasterData()]);
  const materialById = new Map(materials.map(material => [material.id, material]));
  const docById = new Map(documents.map(doc => [doc.id, doc]));
  const itemRows = items.map(item => ({ ...item, material: materialById.get(item.material_id), doc: docById.get(item.outbound_doc_id) }));
  const allocatable = documents.filter(doc => ["draft", "submitted"].includes(doc.status));
  return <div className="page">
    <PageHeader eyebrow="Outbound · live" icon={Truck} title="Order Keluar & Alokasi" description="Buat kebutuhan, lalu alokasikan stok otomatis dengan FEFO. Ledger Reserve tidak mengurangi saldo fisik." />
    <section className="grid grid-2">
      <div><div className="section-header"><h2 className="section-title">Order outbound baru</h2></div><DocumentWorkflowForm action={createOutboundAction} kind="outbound" materials={materials.map(material => ({ code: material.material_code, label: material.long_description }))} warehouses={warehouses.map(warehouse => warehouse.warehouse_code)} /></div>
      <div><div className="section-header"><h2 className="section-title">Alokasi FEFO</h2></div><WmsActionForm action={allocateOutboundAction} submitLabel="Alokasikan Stok">
        <label className="wms-field wide"><span>Order *</span><select name="outbound_document_id" required><option value="">Pilih order</option>{allocatable.map(doc => <option key={doc.id} value={doc.id}>{doc.doc_no} · {doc.destination ?? "-"}</option>)}</select></label>
      </WmsActionForm><div className="inventory-message warning">Alokasi akan gagal atomik bila stok tersedia tidak cukup; tidak ada reservasi parsial tertinggal.</div></div>
    </section>
    <section className="section"><DataTable columns={[
      { key: "doc", header: "Order", render: row => <span className="mono-strong">{row.doc_no}</span> },
      { key: "date", header: "Tanggal", render: row => row.document_date ?? row.created_at.slice(0,10) },
      { key: "destination", header: "Tujuan", render: row => row.destination ?? "-" },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
      { key: "tasks", header: "Pick Tasks", render: row => tasks.filter(task => items.some(item => item.id === task.outbound_item_id && item.outbound_doc_id === row.id)).length },
      { key: "dn", header: "DN", render: row => notes.find(note => note.outbound_doc_id === row.id)?.dn_no ?? "-" },
    ]} rows={documents} emptyMessage="Belum ada order outbound." /></section>
    <section className="section"><DataTable columns={[
      { key: "order", header: "Order", render: row => row.doc?.doc_no ?? "-" },
      { key: "material", header: "Material", render: row => row.material?.long_description ?? "-" },
      { key: "lot", header: "Lot", render: row => row.lot_number ?? "FEFO" },
      { key: "requested", header: "Requested", render: row => `${formatKg(row.requested_qty_kg)} KG` },
      { key: "allocated", header: "Allocated", render: row => `${formatKg(row.allocated_qty_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={itemRows} /></section>
  </div>;
}
