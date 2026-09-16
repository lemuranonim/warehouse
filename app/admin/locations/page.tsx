import { MapPinned } from "lucide-react";
import { saveLocationAction, saveWarehouseAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getLocationMasterData } from "@/lib/wms-queries";

export default async function LocationsPage() {
  const { warehouses, locations } = await getLocationMasterData();
  return <div className="page">
    <PageHeader eyebrow="Location master · live" icon={MapPinned} title="Warehouse & Location Master" description="Konfigurasi gudang, receiving, storage, staging, dan loading. Token scan lokasi dibuat otomatis." />
    <section className="grid grid-2">
      <div><div className="section-header"><h2 className="section-title">Warehouse</h2></div><WmsActionForm action={saveWarehouseAction} submitLabel="Simpan Warehouse">
        <label className="wms-field"><span>Kode Warehouse *</span><input name="warehouse_code" placeholder="Contoh: WH-01" required /></label>
        <label className="wms-field"><span>Nama Warehouse *</span><input name="warehouse_name" placeholder="Nama gudang" required /></label>
        <label className="wms-field"><span>Site</span><input name="site_name" placeholder="Lokasi site" /></label>
      </WmsActionForm></div>
      <div><div className="section-header"><h2 className="section-title">Lokasi</h2></div><WmsActionForm action={saveLocationAction} submitLabel="Simpan Lokasi">
        <label className="wms-field"><span>Kode Lokasi *</span><input name="location_code" placeholder="Contoh: WH01-A01-R01-B01" required /></label>
        <label className="wms-field"><span>Warehouse *</span><select name="warehouse_code" required><option value="">Pilih warehouse</option>{warehouses.map(w => <option key={w.id} value={w.warehouse_code}>{w.warehouse_code}</option>)}</select></label>
        <label className="wms-field"><span>Tipe *</span><select name="location_type"><option value="receiving">Receiving</option><option value="storage">Storage</option><option value="staging">Staging</option><option value="loading">Loading</option><option value="quarantine">Quarantine</option></select></label>
        <label className="wms-field"><span>Kapasitas (KG)</span><input min="0.001" name="capacity_kg" placeholder="0.000" step="0.001" type="number" /></label>
        <label className="wms-field"><span>Room</span><input name="room_name" placeholder="Opsional" /></label>
        <label className="wms-field"><span>Aisle</span><input name="aisle_name" placeholder="Opsional" /></label>
        <label className="wms-field"><span>Rack</span><input name="rack_name" placeholder="Opsional" /></label>
        <label className="wms-field"><span>Level / Bin</span><input name="level_name" placeholder="Opsional" /></label>
      </WmsActionForm></div>
    </section>
    <section className="section"><DataTable columns={[
      { key: "code", header: "Location", render: row => <span className="mono-strong">{row.location_code}</span> },
      { key: "warehouse", header: "Warehouse", render: row => row.warehouse ?? "-" },
      { key: "site", header: "Site", render: row => row.site ?? "-" },
      { key: "type", header: "Type", render: row => <StatusBadge value={row.location_type} /> },
      { key: "capacity", header: "Capacity", render: row => row.capacity_kg ? `${formatKg(row.capacity_kg)} KG` : "-" },
      { key: "active", header: "Status", render: row => <StatusBadge value={row.is_active ? "active" : "inactive"} /> },
    ]} rows={locations} emptyMessage="Belum ada lokasi. Buat warehouse lalu lokasi receiving dan storage." /></section>
  </div>;
}
