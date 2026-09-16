import { Database } from "lucide-react";
import { openCycleCountAction, requestAdjustmentAction, reviewCycleCountAction, submitCycleCountAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getCycleAndAdjustmentData } from "@/lib/wms-queries";
import { getCurrentWmsAccess } from "@/lib/auth";

export default async function CycleCountPage() {
  const [{ sessions, lines, lpns, materials, locations }, access] = await Promise.all([getCycleAndAdjustmentData(), getCurrentWmsAccess()]);
  const canManage = access?.roles.some(role => role === "Admin" || role === "Supervisor") ?? false;
  const locationById = new Map(locations.map(location => [location.id, location])); const lpnById = new Map(lpns.map(lpn => [lpn.id, lpn])); const materialById = new Map(materials.map(material => [material.id, material]));
  const rows = lines.map(line => { const lpn = line.lpn_id ? lpnById.get(line.lpn_id) : undefined; return { ...line, lpn, material: lpn ? materialById.get(lpn.material_id) : undefined, location: line.location_id ? locationById.get(line.location_id) : undefined }; });
  return <div className="page">
    <PageHeader eyebrow="Cycle count · live" icon={Database} title="Cycle Count & Rekonsiliasi" description="Snapshot saldo per lokasi, input aktual, lalu supervisor menyetujui adjustment ledger." />
    <section className="grid grid-3">
      {canManage ? <div><div className="section-header"><h2 className="section-title">Buka sesi</h2></div><WmsActionForm action={openCycleCountAction} submitLabel="Buka Cycle Count"><label className="wms-field"><span>Lokasi *</span><select name="location_id" required><option value="">Pilih</option>{locations.filter(l => l.is_active).map(l => <option key={l.id} value={l.id}>{l.location_code} · {l.warehouse}</option>)}</select></label></WmsActionForm></div> : null}
      <div><div className="section-header"><h2 className="section-title">Input aktual</h2></div><WmsActionForm action={submitCycleCountAction} submitLabel="Simpan Hitungan"><label className="wms-field"><span>Line *</span><select name="cycle_count_line_id" required><option value="">Pilih</option>{rows.filter(l => !l.is_counted).map(l => <option key={l.id} value={l.id}>{l.location?.location_code} · {l.lpn?.lpn_code} · buku {formatKg(l.expected_qty_kg)}</option>)}</select></label><label className="wms-field"><span>Qty Aktual *</span><input min="0" name="actual_qty_kg" required step="0.001" type="number" /></label></WmsActionForm></div>
      {canManage ? <div><div className="section-header"><h2 className="section-title">Review sesi</h2></div><WmsActionForm action={reviewCycleCountAction} submitLabel="Proses Review"><label className="wms-field"><span>Sesi Counted *</span><select name="cycle_count_session_id" required><option value="">Pilih</option>{sessions.filter(s => s.status === "counted").map(s => <option key={s.id} value={s.id}>{s.id.slice(0,8)} · {locationById.get(s.scope_location_id ?? "")?.location_code}</option>)}</select></label><label className="wms-field"><span>Keputusan</span><select name="decision"><option value="approve">Approve</option><option value="reject">Reject</option></select></label></WmsActionForm></div> : null}
    </section>
    <section className="section"><div className="section-header"><div><h2 className="section-title">Ajukan koreksi di luar sesi</h2><p className="section-subtitle">Memerlukan approval Supervisor dan tidak langsung mengubah saldo.</p></div></div><WmsActionForm action={requestAdjustmentAction} submitLabel="Ajukan Adjustment"><label className="wms-field"><span>Token LPN *</span><input name="lpn_token" required /></label><label className="wms-field"><span>Saldo target KG *</span><input min="0" name="target_qty_kg" required step="0.001" type="number" /></label><label className="wms-field"><span>Reason *</span><select name="reason_code"><option>COUNT_VARIANCE</option><option>DAMAGE</option><option>QUALITY_HOLD</option><option>DATA_CORRECTION</option></select></label><label className="wms-field wide"><span>Catatan</span><input name="note" /></label></WmsActionForm></section>
    <section className="section"><DataTable columns={[
      { key: "session", header: "Session", render: row => row.session_id.slice(0,8) },
      { key: "location", header: "Location", render: row => row.location?.location_code ?? "-" },
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn?.lpn_code ?? "-"}</span> },
      { key: "material", header: "Material", render: row => row.material?.long_description ?? "-" },
      { key: "book", header: "Book KG", render: row => formatKg(row.expected_qty_kg) },
      { key: "actual", header: "Actual KG", render: row => row.is_counted ? formatKg(row.actual_qty_kg) : "Belum" },
      { key: "variance", header: "Variance", render: row => row.is_counted ? formatKg(row.variance_qty_kg) : "-" },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.is_counted ? row.status : "pending"} /> },
    ]} rows={rows} emptyMessage="Belum ada sesi cycle count." /></section>
  </div>;
}
