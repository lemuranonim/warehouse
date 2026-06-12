import { MapPinned, PackageCheck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { workflowSteps } from "@/lib/demo-data";

export default function PutawayPage() {
  const rows = workflowSteps.filter((step) => step.workflow === "Putaway");
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="secondary-button" type="button">
            <MapPinned aria-hidden size={18} /> Check Location
          </button>
        }
        eyebrow="Putaway"
        icon={PackageCheck}
        title="Confirm LPN into storage location."
        description="Scan the received LPN, scan the destination bin, and close the putaway task once the location is correct."
      />
      <section className="section">
        <ScannerConsole />
      </section>
      <section className="section">
        <DataTable
          columns={[
            { key: "activity", header: "Task", render: (row) => row.activity },
            { key: "scan", header: "Scan", render: (row) => row.scanRequired },
            { key: "action", header: "Result", render: (row) => row.output },
            { key: "before", header: "From Status", render: (row) => <StatusBadge value={row.statusBefore} /> },
            { key: "after", header: "To Status", render: (row) => <StatusBadge value={row.statusAfter} /> }
          ]}
          rows={rows}
        />
      </section>
    </div>
  );
}
