import { Boxes } from "lucide-react";
import { saveMaterialAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getMaterialMasterData } from "@/lib/wms-queries";

export default async function MaterialsPage() {
  const { materials } = await getMaterialMasterData();
  return <div className="page">
    <PageHeader eyebrow="Item master · live" icon={Boxes} title="Item Master" description="Kelola SKU sumber tunggal untuk inbound, inventory, alokasi FEFO, dan pelaporan." />
    <section className="section">
      <div className="section-header"><div><h2 className="section-title">Tambah atau perbarui material</h2><p className="section-subtitle">Material code yang sama akan diperbarui tanpa membuat duplikat.</p></div></div>
      <WmsActionForm action={saveMaterialAction} submitLabel="Simpan Material">
        <label className="wms-field"><span>Material Code *</span><input name="material_code" required /></label>
        <label className="wms-field wide"><span>Description *</span><input name="material_description" required /></label>
        <label className="wms-field"><span>Hybrid</span><input name="hybrid" /></label>
        <label className="wms-field"><span>Stage</span><input name="stage" /></label>
        <label className="wms-field"><span>Type</span><input name="material_type" /></label>
        <label className="wms-field"><span>Product</span><input name="product" /></label>
        <label className="wms-field"><span>Crop</span><input name="crop" /></label>
        <label className="wms-field"><span>Pack KG *</span><input min="0" name="package_kg" required step="0.001" type="number" /></label>
      </WmsActionForm>
    </section>
    <section className="section"><DataTable columns={[
      { key: "code", header: "SKU", render: row => <span className="mono-strong">{row.material_code}</span> },
      { key: "description", header: "Description", render: row => row.long_description },
      { key: "hybrid", header: "Hybrid", render: row => row.hybrid ?? "-" },
      { key: "stage", header: "Stage", render: row => row.stage ?? "-" },
      { key: "product", header: "Product", render: row => row.product ?? "-" },
      { key: "crop", header: "Crop", render: row => row.crop ?? "-" },
      { key: "package", header: "Pack Size", render: row => `${formatKg(row.standard_package_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.is_active ? "active" : "inactive"} /> },
    ]} rows={materials} emptyMessage="Belum ada material. Tambahkan material pertama sebelum membuat ASN." /></section>
  </div>;
}
