import {
  Activity,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  History,
  MapPinCheck,
  PackageCheck,
  PackagePlus,
  ScanLine,
  Search,
  ShieldCheck,
  Truck,
  Zap
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WorkspaceLinkCard } from "@/components/workspace-link-card";
import {
  ADMIN_ROLES,
  CHECKER_ROLES,
  OPERATOR_ROLES,
  SUPERVISOR_ROLES,
  hasAllowedRole,
  type WmsRole,
} from "@/lib/access-control";
import { formatKg, formatNumber } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth";
import { getDashboardData } from "@/lib/supabase/queries";

const workspaceActions: Array<{
  href: string;
  title: string;
  description: string;
  icon: typeof ScanLine;
  tone: "blue" | "green" | "amber" | "violet";
  roles: readonly WmsRole[] | null;
}> = [
  { href: "/operator/scan", title: "Scan Barcode", description: "Validasi LPN, lokasi, atau dokumen", icon: ScanLine, tone: "blue", roles: null },
  { href: "/operator/lookup", title: "Cari Inventori", description: "Cek saldo, lot, dan lokasi LPN", icon: Search, tone: "violet", roles: null },
  { href: "/admin/inbound", title: "Buat Inbound", description: "Siapkan ASN barang masuk", icon: PackagePlus, tone: "green", roles: ADMIN_ROLES },
  { href: "/checker/receiving", title: "Terima Barang", description: "Verifikasi kuantitas aktual", icon: ClipboardCheck, tone: "green", roles: CHECKER_ROLES },
  { href: "/operator/putaway", title: "Putaway", description: "Pindahkan LPN ke lokasi simpan", icon: MapPinCheck, tone: "blue", roles: OPERATOR_ROLES },
  { href: "/operator/picking", title: "Picking", description: "Kerjakan tugas pengambilan", icon: ClipboardList, tone: "amber", roles: OPERATOR_ROLES },
  { href: "/checker/shipping", title: "Kirim Barang", description: "Buat DN dan konfirmasi dispatch", icon: Truck, tone: "amber", roles: CHECKER_ROLES },
  { href: "/supervisor/adjustments", title: "Koreksi Stok", description: "Review penyesuaian inventori", icon: ShieldCheck, tone: "violet", roles: SUPERVISOR_ROLES },
];

export default async function DashboardPage() {
  const access = await requirePageAccess();
  const dashboard = await getDashboardData();
  const { metrics, currentStock: stock, movements: stockMovements } = dashboard;
  const availableActions = workspaceActions.filter((action) => hasAllowedRole(access.roles, action.roles));

  return (
    <div className="page">
      <PageHeader
        actions={
          <span className={`status ${dashboard.source === "live" ? "green" : dashboard.source === "demo" ? "amber" : "rose"}`}>
            {dashboard.source === "live" ? "LIVE DATA" : dashboard.source === "demo" ? "DEMO DATA" : "DATA OFFLINE"}
          </span>
        }
        eyebrow="Inventory Overview"
        title="Ringkasan Inventori"
        description="Saldo, aktivitas terbaru, dan akses cepat pekerjaan warehouse dalam satu layar."
      />

      {dashboard.source !== "live" ? (
        <div className={`inventory-message ${dashboard.source === "error" ? "error" : "warning"}`} role="status">
          {dashboard.errorMessage ?? "Mode demo aktif. Angka berikut bukan saldo operasional dan tidak boleh digunakan untuk keputusan warehouse."}
        </div>
      ) : null}

      {/* KPI Cards */}
      <section className="grid grid-4">
        <MetricCard
          helper="Saldo stok saat ini"
          icon={Gauge}
          label="On Hand"
          tone="blue"
          value={`${formatKg(metrics.totalStockKg)} KG`}
        />
        <MetricCard
          helper="Siap untuk alokasi"
          icon={PackageCheck}
          label="Available"
          tone="green"
          value={`${formatKg(metrics.availableStockKg)} KG`}
        />
        <MetricCard
          helper="Transaksi terposting hari ini"
          icon={History}
          label="Transactions"
          tone="amber"
          value={formatNumber(metrics.movementCount)}
        />
        <MetricCard
          helper="SKU aktif dalam master"
          icon={Boxes}
          label="SKUs"
          tone="violet"
          value={formatNumber(metrics.materialCount)}
        />
      </section>

      {/* Activity bar */}
      <div className="activity-strip">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={13} style={{ color: "var(--amber)" }} />
          <span className="activity-strip-title">
            Aktivitas Hari Ini
          </span>
        </div>
        {[
          { icon: PackagePlus, label: "Diterima", value: `${formatKg(metrics.inboundKg)} KG`, color: "var(--green)" },
          { icon: Truck,       label: "Dikirim", value: `${formatKg(metrics.outboundKg)} KG`, color: "var(--navy)" },
          { icon: Activity,    label: "Transaksi", value: formatNumber(metrics.movementCount), color: "var(--amber)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div className="activity-strip-item" key={label}>
            <Icon size={13} style={{ color }} />
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{label}:</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-2)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Direct workspaces */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mulai Pekerjaan</h2>
            <p className="section-subtitle">Pilih tugas yang akan dikerjakan sekarang.</p>
          </div>
        </div>
        <div className="workspace-link-grid">
          {availableActions.map((action) => <WorkspaceLinkCard key={action.href} {...action} />)}
        </div>
      </section>

      {/* Tables */}
      <section className="section grid grid-2">
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Inventory by LPN</h2>
              <p className="section-subtitle">SKU, lot, lokasi, kuantitas, dan status inventori.</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "lpn", header: "LPN",
                render: (row) => (
                  <span style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700
                  }}>
                    {row.lpnCode}
                  </span>
                )
              },
              { key: "material", header: "Item", render: (row) => row.materialDescription },
              {
                key: "qty", header: "Qty On Hand",
                render: (row) => (
                  <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                    {formatKg(row.qtyCurrentKg)} KG
                  </span>
                )
              },
              { key: "location", header: "Lokasi", render: (row) => row.currentLocation },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> }
            ]}
            rows={stock}
          />
        </div>
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Riwayat Transaksi</h2>
              <p className="section-subtitle">Terbaru: penerimaan, picking, pengiriman, dan penyesuaian.</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "doc", header: "Referensi",
                render: (row) => (
                  <span style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.76rem", color: "var(--navy)", fontWeight: 700
                  }}>
                    {row.docNo}
                  </span>
                )
              },
              { key: "type", header: "Transaksi", render: (row) => row.transactionType },
              {
                key: "lpn", header: "LPN",
                render: (row) => (
                  <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>{row.lpnCode}</span>
                )
              },
              {
                key: "qty", header: "Qty",
                render: (row) => (
                  <span style={{ fontWeight: 700 }}>{formatKg(row.movementQtyKg)} KG</span>
                )
              },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.statusAfter} /> }
            ]}
            rows={dashboard.source === "live" ? stockMovements.slice(0, 6) : stockMovements.slice(-6).reverse()}
          />
        </div>
      </section>

    </div>
  );
}
