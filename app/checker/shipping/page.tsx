import Link from "next/link";
import { FileCheck, FileDown, Send } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { deliveryNotes, scanScenarios, workflowSteps } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

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
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Antrian Delivery Note</div>
            <div className="section-subtitle">Cocokkan seluruh lot dan kuantitas terhadap dokumen sebelum konfirmasi dispatch.</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "dn", header: "DN No", render: (row) => <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{row.dnNo}</span> },
            { key: "date", header: "Tanggal", render: (row) => row.dnDate },
            { key: "destination", header: "Tujuan", render: (row) => row.destination },
            { key: "vehicle", header: "Kendaraan", render: (row) => row.vehicle },
            { key: "lines", header: "Lot", render: (row) => row.lines.length },
            { key: "qty", header: "Qty", render: (row) => <strong>{formatKg(row.totalQtyKg)} KG</strong> },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
            { key: "action", header: "", render: (row) => (
              <Link className="secondary-button compact-button" href={`/documents/delivery/${row.dnNo}`}>
                <FileDown aria-hidden size={14} /> Preview
              </Link>
            ) },
          ]}
          rows={deliveryNotes}
        />
      </section>
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
