import { FileCheck, Send } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { scanScenarios, workflowSteps } from "@/lib/demo-data";

export default function ShippingPage() {
  const rows = workflowSteps.filter((step) => ["Staging", "Dispatch"].includes(step.workflow));
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <Send aria-hidden size={18} /> Confirm Dispatch
          </button>
        }
        eyebrow="Dispatch"
        icon={FileCheck}
        title="Validate load and close dispatch."
        description="Scan the delivery note and assigned LPNs before stock is issued from the warehouse."
      />
      <section className="grid grid-2">
        <DataTable
          columns={[
            { key: "step", header: "Seq", render: (row) => row.step },
            { key: "workflow", header: "Stage", render: (row) => row.workflow },
            { key: "activity", header: "Activity", render: (row) => row.activity },
            { key: "after", header: "Target Status", render: (row) => <StatusBadge value={row.statusAfter} /> }
          ]}
          rows={rows}
        />
        <DataTable
          columns={[
            { key: "scenario", header: "Task", render: (row) => row.scenario },
            { key: "scan", header: "First Scan", render: (row) => row.firstScan },
            { key: "input", header: "Next Step", render: (row) => row.nextInput },
            { key: "result", header: "Result", render: (row) => row.result }
          ]}
          rows={scanScenarios.filter((scenario) => ["Dispatch Confirmation"].includes(scenario.scenario))}
        />
      </section>
    </div>
  );
}
