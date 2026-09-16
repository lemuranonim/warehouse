import { Printer, QrCode } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { LabelPreview } from "@/components/label-preview";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { formatKg } from "@/lib/format";
import { getInventoryData } from "@/lib/wms-queries";

export default async function LabelsPage() {
  const { inventory } = await getInventoryData();
  const selected = inventory[0];
  const label = selected ? { lpn: selected.lpn_code, sku: selected.material_code, lot: selected.lot_number, qty: `${formatKg(selected.qty_current_kg)} KG`, inventoryType: selected.stock_type, inboundRef: selected.inbound_doc_id?.slice(0,8) ?? "IMPORT", status: selected.status, token: selected.scan_token ?? "TOKEN-NOT-FOUND" } : null;
  return <div className="page">
    <PageHeader actions={<PrintButton />} eyebrow="Label printing · live" icon={QrCode} title="LPN Labels" description="QR menunjuk ke lookup aman dan menggunakan token opaque dari database, bukan ID internal." />
    {label ? <LabelPreview label={label} /> : <div className="empty-state">Belum ada LPN. Terima inbound atau post inventory import terlebih dahulu.</div>}
    <section className="section"><div className="section-header"><div><h2 className="section-title">Antrian label</h2><p className="section-subtitle">Gunakan baris terbaru sebagai preview cetak saat ini.</p></div><Printer size={18} /></div><DataTable columns={[
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn_code}</span> },
      { key: "material", header: "Material", render: row => `${row.material_code} · ${row.material_description}` },
      { key: "lot", header: "Lot", render: row => row.lot_number },
      { key: "qty", header: "Qty", render: row => `${formatKg(row.qty_current_kg)} KG` },
      { key: "token", header: "Token", render: row => row.scan_token ?? "-" },
      { key: "status", header: "Status", render: row => row.status },
    ]} rows={inventory.slice(0,200)} /></section>
  </div>;
}
