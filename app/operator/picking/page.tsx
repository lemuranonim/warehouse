import { ClipboardList } from "lucide-react";
import { pickTaskAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getPickingData } from "@/lib/wms-queries";

export default async function PickingPage() {
  const { tasks, items, documents, lpns, locations } = await getPickingData();
  const itemById = new Map(items.map(item => [item.id, item])); const docById = new Map(documents.map(doc => [doc.id, doc]));
  const lpnById = new Map(lpns.map(lpn => [lpn.id, lpn])); const locationById = new Map(locations.map(location => [location.id, location.location_code]));
  const rows = tasks.map(task => { const item = itemById.get(task.outbound_item_id); return { ...task, item, doc: item ? docById.get(item.outbound_doc_id) : undefined, lpn: lpnById.get(task.lpn_id), location: task.from_location_id ? locationById.get(task.from_location_id) : "-" }; });
  return <div className="page">
    <PageHeader eyebrow="Picking · live" icon={ClipboardList} title="Picking Tasks" description="Konfirmasi task yang dialokasikan. Partial pick otomatis membuat child LPN tanpa merusak histori saldo." />
    <section className="section"><WmsActionForm action={pickTaskAction} submitLabel="Confirm Pick">
      <label className="wms-field wide"><span>Task *</span><select name="picking_task_id" required><option value="">Pilih task</option>{rows.filter(task => task.status === "open").map(task => <option key={task.id} value={task.id}>{task.doc?.doc_no} · {task.lpn?.lpn_code} · {task.location} · {formatKg(task.qty_kg)} KG</option>)}</select></label>
    </WmsActionForm></section>
    <section className="section"><DataTable columns={[
      { key: "order", header: "Order", render: row => row.doc?.doc_no ?? "-" },
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn?.lpn_code ?? "-"}</span> },
      { key: "lot", header: "Lot", render: row => row.lpn?.lot_number ?? "-" },
      { key: "location", header: "Pick From", render: row => row.location ?? "-" },
      { key: "qty", header: "Qty", render: row => `${formatKg(row.qty_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
      { key: "picked", header: "Picked At", render: row => row.picked_at ? new Date(row.picked_at).toLocaleString("id-ID") : "-" },
    ]} rows={rows} emptyMessage="Belum ada picking task. Supervisor perlu mengalokasikan order." /></section>
  </div>;
}
