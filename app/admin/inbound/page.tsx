import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { createInboundAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { DocumentWorkflowForm } from "@/components/document-workflow-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatKg } from "@/lib/format";
import { getInboundData, getMasterData } from "@/lib/wms-queries";

export default async function InboundPage() {
  const [{ documents, items, materials }, { stockTypes }] = await Promise.all([getInboundData(), getMasterData()]);
  const materialById = new Map(materials.map(material => [material.id, material]));
  const rows = items.map(item => ({ ...item, material: materialById.get(item.material_id), document: documents.find(doc => doc.id === item.inbound_doc_id) }));
  return <div className="page">
    <PageHeader eyebrow="ASN / Inbound · live" icon={PackagePlus} title="Manajemen Inbound" description="Buat rencana penerimaan. Setiap baris diterima checker menjadi LPN dan movement ledger." />
    <section className="section"><div className="section-header"><div><h2 className="section-title">Buat ASN satu baris</h2><p className="section-subtitle">Tambahkan baris berikutnya menggunakan nomor dokumen baru atau integrasi upload batch.</p></div></div>
      <DocumentWorkflowForm action={createInboundAction} kind="inbound" materials={materials.map(material => ({ code: material.material_code, label: material.long_description }))} stockTypes={stockTypes.map(type => type.label)} />
    </section>
    <section className="section"><DataTable columns={[
      { key: "doc", header: "ASN", render: row => <Link className="mono-strong" href={`/documents/incoming/${encodeURIComponent(row.doc_no)}`}>{row.doc_no}</Link> },
      { key: "date", header: "Tanggal", render: row => row.document_date ?? row.created_at.slice(0,10) },
      { key: "sender", header: "Pengirim", render: row => row.sender ?? "-" },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
      { key: "received", header: "Diterima", render: row => row.received_at ? new Date(row.received_at).toLocaleString("id-ID") : "-" },
    ]} rows={documents} emptyMessage="Belum ada ASN." /></section>
    <section className="section"><DataTable columns={[
      { key: "doc", header: "ASN", render: row => row.document?.doc_no ?? "-" },
      { key: "material", header: "Material", render: row => row.material?.long_description ?? "-" },
      { key: "lot", header: "Lot", render: row => <span className="lot-code">{row.lot_number}</span> },
      { key: "planned", header: "Planned", render: row => `${formatKg(row.planned_qty_kg)} KG` },
      { key: "received", header: "Received", render: row => `${formatKg(row.received_qty_kg ?? 0)} KG` },
      { key: "type", header: "Type", render: row => row.stock_type },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={rows} emptyMessage="Belum ada line ASN." /></section>
  </div>;
}
