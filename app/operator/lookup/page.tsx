import { Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { formatKg } from "@/lib/format";
import { getInventoryData } from "@/lib/wms-queries";

export default async function LookupPage() {
  const { inventory } = await getInventoryData();
  return <div className="page">
    <PageHeader eyebrow="Inventory lookup · live" icon={Search} title="Lookup LPN & Lokasi" description="Scan token atau telusuri saldo LPN langsung dari database operasional." />
    <section className="section"><ScannerConsole /></section>
    <section className="section"><DataTable columns={[
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn_code}</span> },
      { key: "material", header: "Material", render: row => `${row.material_code} · ${row.material_description}` },
      { key: "lot", header: "Lot", render: row => <span className="lot-code">{row.lot_number}</span> },
      { key: "location", header: "Location", render: row => row.current_location ?? "Belum putaway" },
      { key: "warehouse", header: "Warehouse", render: row => row.warehouse ?? "-" },
      { key: "qty", header: "On Hand", render: row => `${formatKg(row.qty_current_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={inventory} emptyMessage="Belum ada inventory." /></section>
  </div>;
}
