import { PackageCheck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { getInventoryData } from "@/lib/wms-queries";
import { formatKg } from "@/lib/format";

export default async function PutawayPage() {
  const { inventory } = await getInventoryData();
  const rows = inventory.filter(row => ["label_printed", "received"].includes(row.status));
  return (
    <div className="page">
      <PageHeader
        eyebrow="Putaway"
        icon={PackageCheck}
        title="Putaway LPN"
        description="Scan LPN yang diterima, lalu scan lokasi penyimpanan tujuan."
      />
      <section className="section">
        <ScannerConsole />
      </section>
      <section className="section">
        <DataTable
          columns={[
            { key: "lpn", header: "LPN", render: (row) => <span className="mono-strong">{row.lpn_code}</span> },
            { key: "material", header: "Material", render: (row) => row.material_description },
            { key: "lot", header: "Lot", render: (row) => row.lot_number },
            { key: "qty", header: "Qty", render: (row) => `${formatKg(row.qty_current_kg)} KG` },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={rows}
          emptyMessage="Tidak ada LPN menunggu putaway."
        />
      </section>
    </div>
  );
}
