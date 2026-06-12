import { History } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { scanScenarios, stockMovements } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function AuditPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory transactions"
        icon={History}
        title="Trace inventory transactions and scan activity."
        description="Review receipts, putaway, reservations, picks, dispatches, adjustments, scan exceptions, user activity, and document references."
      />
      <section className="grid grid-2">
        <div>
          <h2>Inventory transactions</h2>
          <DataTable
            columns={[
              { key: "date", header: "Posted Date", render: (row) => row.date },
              { key: "doc", header: "Reference", render: (row) => row.docNo },
              { key: "type", header: "Transaction", render: (row) => row.transactionType },
              { key: "lpn", header: "LPN", render: (row) => row.lpnCode },
              { key: "qty", header: "Move Qty", render: (row) => `${formatKg(row.movementQtyKg)} KG` },
              { key: "status", header: "New Status", render: (row) => <StatusBadge value={row.statusAfter} /> }
            ]}
            rows={stockMovements}
          />
        </div>
        <div>
          <h2>Scan controls</h2>
          <DataTable
            columns={[
              { key: "scenario", header: "Task", render: (row) => row.scenario },
              { key: "mode", header: "Mode", render: (row) => row.mode },
              { key: "validation", header: "Control", render: (row) => row.validation },
              { key: "error", header: "Exception", render: (row) => row.error }
            ]}
            rows={scanScenarios}
          />
        </div>
      </section>
    </div>
  );
}
