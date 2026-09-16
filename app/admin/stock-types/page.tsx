import { Database } from "lucide-react";
import { saveStockTypeAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { getMasterData } from "@/lib/wms-queries";

export default async function StockTypesPage() {
  const { stockTypes } = await getMasterData();
  return <div className="page">
    <PageHeader eyebrow="Stock classification · live" icon={Database} title="Tipe Stok Benih" description="Klasifikasi stok yang digunakan konsisten pada penerimaan, LPN, dan laporan." />
    <section className="section"><WmsActionForm action={saveStockTypeAction} submitLabel="Simpan Tipe">
      <label className="wms-field"><span>Kode *</span><input maxLength={10} name="stock_code" required /></label>
      <label className="wms-field"><span>Label *</span><input name="stock_label" required /></label>
      <label className="wms-field wide"><span>Deskripsi</span><input name="stock_description" /></label>
      <label className="wms-field"><span>Warna</span><select name="stock_color"><option>green</option><option>blue</option><option>amber</option><option>red</option><option>violet</option><option>cyan</option><option>gray</option></select></label>
    </WmsActionForm></section>
    <section className="section"><DataTable columns={[
      { key: "code", header: "Code", render: row => <span className="mono-strong">{row.code}</span> },
      { key: "label", header: "Label", render: row => <strong>{row.label}</strong> },
      { key: "description", header: "Description", render: row => row.description ?? "-" },
      { key: "color", header: "Color", render: row => row.color },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.is_active ? "active" : "inactive"} /> },
    ]} rows={stockTypes} /></section>
  </div>;
}
