import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requirePageAccess } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ token: string }> | { token: string } };

export default async function ScanTokenPage({ params }: PageProps) {
  await requirePageAccess();
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("wms_resolve_scan_token", { raw_value: token, workflow: "QR Lookup", device_info: { source: "label_link" } });
  const resolved = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const payload = resolved.display_payload && typeof resolved.display_payload === "object" && !Array.isArray(resolved.display_payload) ? resolved.display_payload as Record<string, unknown> : {};
  const ok = !error && resolved.result === "success";
  const title = String(payload.lpn_code ?? payload.location_code ?? (ok ? resolved.entity_type : `Token ${token} tidak ditemukan`));
  return <div className="page">
    <PageHeader eyebrow="Scan result · live" icon={QrCode} title={title} description="Hasil ini dibaca dari token aktif dan dicatat ke scan audit trail." />
    <section className="card">{ok ? <>
      <div className="toolbar" style={{ justifyContent: "space-between" }}><div><p className="eyebrow">{String(resolved.entity_type)}</p><h2>{title}</h2></div><StatusBadge value={String(payload.status ?? "active")} /></div>
      <div className="grid grid-2">{Object.entries(payload).map(([key,value]) => <div key={key}><p className="muted small">{key.replaceAll("_", " ")}</p><strong>{value === null ? "-" : String(value)}</strong></div>)}</div>
      <div className="toolbar" style={{ marginTop: 16 }}><Link className="primary-button" href="/operator/scan">Open Scan Workstation <ArrowRight size={18} /></Link><Link className="secondary-button" href="/operator/lookup">Inventory Lookup</Link></div>
    </> : <p className="lead">{error?.message ?? String(resolved.message ?? "Token inactive atau tidak terdaftar.")}</p>}</section>
  </div>;
}
