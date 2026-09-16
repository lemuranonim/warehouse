import { ShieldCheck } from "lucide-react";
import { requestAdjustmentAction, reviewAdjustmentAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { formatKg } from "@/lib/format";
import { getAdjustmentData } from "@/lib/wms-queries";

export default async function AdjustmentsPage() {
  const { adjustments, lpns, materials, locations } = await getAdjustmentData();
  const lpnById = new Map(lpns.map(lpn => [lpn.id, lpn])); const materialById = new Map(materials.map(material => [material.id, material])); const locationById = new Map(locations.map(location => [location.id, location]));
  const rows = adjustments.map(adjustment => { const lpn = lpnById.get(adjustment.lpn_id); return { ...adjustment, lpn, material: lpn ? materialById.get(lpn.material_id) : undefined, location: lpn?.current_location_id ? locationById.get(lpn.current_location_id) : undefined }; });
  return <div className="page">
    <PageHeader eyebrow="Stock adjustment · live" icon={ShieldCheck} title="Permintaan & Persetujuan Adjustment" description="Perubahan saldo selalu dua langkah: request terhadap saldo snapshot, lalu approval supervisor ke append-only ledger." />
    <section className="grid grid-2">
      <div><div className="section-header"><h2 className="section-title">Ajukan adjustment</h2></div><WmsActionForm action={requestAdjustmentAction} submitLabel="Ajukan"><label className="wms-field"><span>Token LPN *</span><input name="lpn_token" placeholder="Scan atau masukkan token LPN" required /></label><label className="wms-field"><span>Saldo Target (KG) *</span><input min="0" name="target_qty_kg" placeholder="0.000" required step="0.001" type="number" /></label><label className="wms-field"><span>Alasan *</span><select name="reason_code"><option>COUNT_VARIANCE</option><option>DAMAGE</option><option>QUALITY_HOLD</option><option>DATA_CORRECTION</option></select></label><label className="wms-field wide"><span>Catatan</span><input name="note" placeholder="Jelaskan alasan koreksi" /></label></WmsActionForm></div>
      <div><div className="section-header"><h2 className="section-title">Review pending</h2></div><WmsActionForm action={reviewAdjustmentAction} submitLabel="Proses Review"><label className="wms-field wide"><span>Request *</span><select name="adjustment_request_id" required><option value="">Pilih</option>{rows.filter(r => r.status === "pending").map(r => <option key={r.id} value={r.id}>{r.lpn?.lpn_code} · {formatKg(r.qty_before_kg)} → {formatKg(r.qty_after_kg)} KG · {r.reason_code}</option>)}</select></label><label className="wms-field"><span>Keputusan</span><select name="decision"><option value="approve">Approve</option><option value="reject">Reject</option></select></label></WmsActionForm></div>
    </section>
    <section className="section"><DataTable columns={[
      { key: "id", header: "Request", render: row => row.id.slice(0,8) },
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpn?.lpn_code ?? "-"}</span> },
      { key: "material", header: "Material", render: row => row.material?.long_description ?? "-" },
      { key: "location", header: "Location", render: row => row.location?.location_code ?? "-" },
      { key: "before", header: "Before", render: row => `${formatKg(row.qty_before_kg)} KG` },
      { key: "after", header: "After", render: row => `${formatKg(row.qty_after_kg)} KG` },
      { key: "reason", header: "Reason", render: row => row.reason_code },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={rows} emptyMessage="Belum ada adjustment." /></section>
  </div>;
}
