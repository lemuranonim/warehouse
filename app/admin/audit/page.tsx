import { History } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatKg } from "@/lib/format";
import { getAuditData } from "@/lib/wms-queries";

export default async function AuditPage() {
  const { movements, audits, scans, lpns, materials, locations } = await getAuditData();
  const lpnById = new Map(lpns.map(lpn => [lpn.id, lpn.lpn_code])); const materialById = new Map(materials.map(material => [material.id, material])); const locationById = new Map(locations.map(location => [location.id, location.location_code]));
  return <div className="page">
    <PageHeader eyebrow="Audit trail · live" icon={History} title="Inventory Transactions & Audit" description="Ledger append-only, aktivitas workflow, scan, user, referensi, dan idempotency key untuk penelusuran end-to-end." />
    <section className="section"><div className="section-header"><h2 className="section-title">Stock ledger</h2></div><DataTable columns={[
      { key: "time", header: "Posted", render: row => new Date(row.movement_date).toLocaleString("id-ID") },
      { key: "type", header: "Transaction", render: row => row.transaction_type },
      { key: "material", header: "Material", render: row => materialById.get(row.material_id)?.material_code ?? "-" },
      { key: "lpn", header: "LPN", render: row => lpnById.get(row.lpn_id ?? "") ?? "-" },
      { key: "qty", header: "Move Qty", render: row => `${formatKg(row.movement_qty_kg)} KG` },
      { key: "from", header: "From", render: row => locationById.get(row.from_location_id ?? "") ?? "-" },
      { key: "to", header: "To", render: row => locationById.get(row.to_location_id ?? "") ?? "-" },
      { key: "key", header: "Idempotency", render: row => <span className="mono-strong">{row.idempotency_key.slice(0,22)}</span> },
    ]} rows={movements} /></section>
    <section className="grid grid-2"><div><div className="section-header"><h2 className="section-title">Workflow audit</h2></div><DataTable columns={[
      { key: "time", header: "Time", render: row => new Date(row.occurred_at).toLocaleString("id-ID") },
      { key: "action", header: "Action", render: row => row.action },
      { key: "entity", header: "Entity", render: row => row.entity_type },
      { key: "request", header: "Request", render: row => row.request_id?.slice(0,18) ?? "-" },
    ]} rows={audits} /></div><div><div className="section-header"><h2 className="section-title">Scan events</h2></div><DataTable columns={[
      { key: "time", header: "Time", render: row => new Date(row.scanned_at).toLocaleString("id-ID") },
      { key: "workflow", header: "Workflow", render: row => row.workflow },
      { key: "token", header: "Token", render: row => row.token ?? row.raw_value.slice(0,20) },
      { key: "result", header: "Result", render: row => <StatusBadge value={row.result} /> },
    ]} rows={scans} /></div></section>
  </div>;
}
