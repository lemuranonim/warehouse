import Link from "next/link";
import { FileCheck } from "lucide-react";
import { createDeliveryNoteAction, dispatchOutboundAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { getShippingData } from "@/lib/wms-queries";

export default async function ShippingPage() {
  const { documents, notes, tasks, items } = await getShippingData();
  const stagedDocs = documents.filter(doc => doc.status === "staged"); const dispatchable = documents.filter(doc => doc.status === "dn_created");
  return <div className="page">
    <PageHeader eyebrow="Pengiriman · live" icon={FileCheck} title="Delivery Note & Pengiriman" description="Buat delivery note, lalu konfirmasi pengiriman setelah seluruh barang berada di staging." />
    <section className="grid grid-2">
      <div><div className="section-header"><h2 className="section-title">Buat Delivery Note</h2></div><WmsActionForm action={createDeliveryNoteAction} submitLabel="Buat DN">
        <label className="wms-field wide"><span>Staged Order *</span><select name="outbound_document_id" required><option value="">Pilih order</option>{stagedDocs.map(doc => <option key={doc.id} value={doc.id}>{doc.doc_no} · {doc.destination ?? "-"}</option>)}</select></label>
        <label className="wms-field"><span>Nomor Delivery Note *</span><input name="delivery_note_no" placeholder="Contoh: DN-2026-0001" required /></label>
      </WmsActionForm></div>
      <div><div className="section-header"><h2 className="section-title">Konfirmasi Pengiriman</h2></div><WmsActionForm action={dispatchOutboundAction} submitLabel="Konfirmasi Pengiriman">
        <label className="wms-field wide"><span>Order dengan DN *</span><select name="outbound_document_id" required><option value="">Pilih order</option>{dispatchable.map(doc => <option key={doc.id} value={doc.id}>{doc.doc_no} · {notes.find(note => note.outbound_doc_id === doc.id)?.dn_no}</option>)}</select></label>
      </WmsActionForm></div>
    </section>
    <section className="section"><DataTable columns={[
      { key: "dn", header: "DN", render: row => <Link className="mono-strong" href={`/documents/delivery/${encodeURIComponent(row.dn_no)}`}>{row.dn_no}</Link> },
      { key: "order", header: "Outbound", render: row => documents.find(doc => doc.id === row.outbound_doc_id)?.doc_no ?? "-" },
      { key: "destination", header: "Destination", render: row => row.destination ?? "-" },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
      { key: "shipped", header: "Shipped At", render: row => row.shipped_at ? new Date(row.shipped_at).toLocaleString("id-ID") : "-" },
    ]} rows={notes} emptyMessage="Belum ada delivery note." /></section>
    <div className="inventory-message warning">Dispatch hanya dapat diposting bila seluruh {tasks.length} task aktif untuk order sudah staged. Saat ini terdapat {items.length} line outbound.</div>
  </div>;
}
