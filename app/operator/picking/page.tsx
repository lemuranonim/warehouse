import { ClipboardList, PackageCheck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { scanScenarios, workflowSteps } from "@/lib/demo-data";

export default function PickingPage() {
  const rows = workflowSteps.filter((step) => ["Allocation", "Picking", "Staging"].includes(step.workflow));
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <PackageCheck aria-hidden size={18} /> Confirm Pick
          </button>
        }
        eyebrow="Picking"
        icon={ClipboardList}
        title="Close pick tasks by location, LPN, and quantity."
        description="Use this station to verify the pick face, scan the reserved LPN, and confirm picked quantity."
      />
      <section className="grid grid-2">
        <DataTable
          columns={[
            { key: "workflow", header: "Stage", render: (row) => row.workflow },
            { key: "activity", header: "Task", render: (row) => row.activity },
            { key: "scan", header: "Scan", render: (row) => row.scanRequired },
            { key: "after", header: "Target Status", render: (row) => <StatusBadge value={row.statusAfter} /> }
          ]}
          rows={rows}
        />
        <DataTable
          columns={[
            { key: "scenario", header: "Task", render: (row) => row.scenario },
            { key: "first", header: "First Scan", render: (row) => row.firstScan },
            { key: "next", header: "Next Step", render: (row) => row.nextInput },
            { key: "error", header: "Exception", render: (row) => row.error }
          ]}
          rows={scanScenarios.filter((scenario) => ["Pick Confirmation"].includes(scenario.scenario))}
        />
      </section>
    </div>
  );
}
