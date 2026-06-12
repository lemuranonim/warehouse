import { Search } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { currentStock, scanLinks } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function LookupPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory lookup"
        icon={Search}
        title="Search LPN, location, SKU, outbound order, or delivery note."
        description="Use inquiry mode to view inventory detail without posting a warehouse transaction."
      />
      <ScannerConsole />
      <section className="section grid grid-2">
        <DataTable
          columns={[
            { key: "token", header: "Token", render: (row) => row.token },
            { key: "type", header: "Entity", render: (row) => row.entityType },
            { key: "code", header: "Reference", render: (row) => row.entityCode },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={scanLinks}
        />
        <DataTable
          columns={[
            { key: "lpn", header: "LPN", render: (row) => row.lpnCode },
            { key: "material", header: "Item", render: (row) => row.materialDescription },
            { key: "qty", header: "Qty On Hand", render: (row) => `${formatKg(row.qtyCurrentKg)} KG` },
            { key: "status", header: "Inventory Status", render: (row) => <StatusBadge value={row.status} /> }
          ]}
          rows={currentStock()}
        />
      </section>
    </div>
  );
}
