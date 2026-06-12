import {
  Activity,
  Boxes,
  Gauge,
  History,
  PackageCheck,
  PackagePlus,
  TrendingUp,
  Truck,
  Zap
} from "lucide-react";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProcessMap } from "@/components/process-map";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowBoard } from "@/components/workflow-board";
import {
  currentStock,
  dashboardMetrics,
  stockMovements,
  workflowSteps
} from "@/lib/demo-data";
import { formatKg, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const metrics = dashboardMetrics();
  const stock = currentStock();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Inventory Overview"
        title="Inventory Control Tower"
        description="Monitor stok tersedia, status LPN, dan progress operasional gudang PT Advanta Seeds Indonesia secara real-time."
      />

      {/* KPI Cards */}
      <section className="grid grid-4">
        <MetricCard
          helper="Saldo stok saat ini"
          icon={Gauge}
          label="On Hand"
          tone="blue"
          value={`${formatKg(metrics.totalStockKg)} KG`}
          trend="↑ 3.2%"
          trendUp={true}
        />
        <MetricCard
          helper="Siap untuk alokasi"
          icon={PackageCheck}
          label="Available"
          tone="green"
          value={`${formatKg(metrics.availableStockKg)} KG`}
          trend="↑ 1.8%"
          trendUp={true}
        />
        <MetricCard
          helper="Transaksi terposting hari ini"
          icon={History}
          label="Transactions"
          tone="amber"
          value={formatNumber(metrics.movementCount)}
          trend="↑ 12"
          trendUp={true}
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
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        marginTop: 16,
        padding: "13px 20px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-xs)",
        flexWrap: "wrap",
        borderLeft: "3px solid var(--green)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={13} style={{ color: "var(--amber)" }} />
          <span style={{
            fontSize: "0.68rem", color: "var(--muted)",
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em"
          }}>
            Aktivitas Hari Ini
          </span>
        </div>
        <div style={{ width: 1, height: 18, background: "var(--line)" }} />
        {[
          { icon: PackagePlus, label: "Diterima", value: `${formatKg(metrics.inboundKg)} KG`, color: "var(--green)" },
          { icon: Truck,       label: "Dikirim", value: `${formatKg(metrics.outboundKg)} KG`, color: "var(--navy)" },
          { icon: Activity,    label: "Transaksi", value: formatNumber(metrics.movementCount), color: "var(--amber)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon size={13} style={{ color }} />
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{label}:</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-2)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Workflow */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Alur Gudang</h2>
            <p className="section-subtitle">
              Penerimaan inbound, putaway, alokasi, picking, staging, pengiriman, dan cycle count.
            </p>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: "0.7rem", fontWeight: 700,
            color: "var(--green)", background: "var(--green-light)",
            padding: "4px 10px", borderRadius: 6,
            border: "1px solid var(--green-mid)"
          }}>
            <TrendingUp size={11} /> Semua step aktif
          </span>
        </div>
        <WorkflowBoard steps={workflowSteps} />
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
            rows={stockMovements.slice(-6).reverse()}
          />
        </div>
      </section>

      {/* Process Map */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Progress Pekerjaan</h2>
            <p className="section-subtitle">
              Handoff operasional antar perencana, penerimaan, operator, checker, dan supervisor.
            </p>
          </div>
          <div className="toolbar">
            <span className="secondary-button">
              <PackagePlus aria-hidden size={14} />
              Diterima {formatKg(metrics.inboundKg)} KG
            </span>
            <span className="secondary-button">
              <Truck aria-hidden size={14} />
              Dikirim {formatKg(metrics.outboundKg)} KG
            </span>
          </div>
        </div>
        <ProcessMap />
      </section>
    </div>
  );
}
