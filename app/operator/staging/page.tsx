import { MapPin } from "lucide-react";
import { stageTaskAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getPickingData } from "@/lib/wms-queries";

export default async function StagingPage() {
  const { tasks, items, documents, lpns, locations } = await getPickingData();
  const itemById = new Map(items.map(item => [item.id, item])); const docById = new Map(documents.map(doc => [doc.id, doc])); const lpnById = new Map(lpns.map(lpn => [lpn.id, lpn]));
  const rows = tasks.map(task => { const item = itemById.get(task.outbound_item_id); return { ...task, doc: item ? docById.get(item.outbound_doc_id) : undefined, lpn: lpnById.get(task.picked_lpn_id ?? task.lpn_id) }; });
  const stagingLocations = locations.filter(location => ["staging", "loading"].includes(location.location_type));
  return <div className="page">
    <PageHeader eyebrow="Staging · live" icon={MapPin} title="Staging & Loading" description="Pindahkan LPN yang sudah dipicking ke area staging sebelum pengiriman." />
    <section className="section"><WmsActionForm action={stageTaskAction} submitLabel="Konfirmasi Staging">
      <label className="wms-field wide"><span>Tugas yang Sudah Dipicking *</span><select name="picking_task_id" required><option value="">Pilih tugas</option>{rows.filter(task => task.status === "picked").map(task => <option key={task.id} value={task.id}>{task.doc?.doc_no} · {task.lpn?.lpn_code} · {formatKg(task.qty_kg)} KG</option>)}</select></label>
      <label className="wms-field"><span>Lokasi Staging *</span><select name="staging_location_code" required><option value="">Pilih lokasi</option>{stagingLocations.map(location => <option key={location.id}>{location.location_code}</option>)}</select></label>
    </WmsActionForm></section>
    <section className="grid grid-2"><div><div className="section-header"><h2 className="section-title">Task staging</h2></div><DataTable columns={[
      { key: "order", header: "Order", render: row => row.doc?.doc_no ?? "-" },
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn?.lpn_code ?? "-"}</span> },
      { key: "qty", header: "Qty", render: row => `${formatKg(row.qty_kg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={rows.filter(row => ["picked", "staged"].includes(row.status))} /></div>
      <div><div className="section-header"><h2 className="section-title">Area staging aktif</h2></div><DataTable columns={[
        { key: "location", header: "Location", render: row => <span className="mono-strong">{row.location_code}</span> },
        { key: "warehouse", header: "Warehouse", render: row => row.warehouse ?? "-" },
        { key: "type", header: "Type", render: row => <StatusBadge value={row.location_type} /> },
      ]} rows={stagingLocations} /></div></section>
  </div>;
}
