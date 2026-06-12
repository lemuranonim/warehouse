import { Eye } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  currentStock,
  dashboardMetrics,
  stockMovements,
  inboundDocuments,
  outboundOrders,
} from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function ViewerPage() {
  const metrics = dashboardMetrics();
  const stock = currentStock();
  const recent = [...stockMovements].reverse().slice(0, 6);
  const openInbound = inboundDocuments.filter((d) =>
    ["planned", "receiving"].includes(d.status)
  );
  const openOutbound = outboundOrders.filter((o) =>
    !["dispatched", "closed"].includes(o.status)
  );

  const kpis = [
    { label: "On Hand (KG)", value: formatKg(metrics.totalStockKg), color: "var(--navy)" },
    { label: "Available (KG)", value: formatKg(metrics.availableStockKg), color: "var(--green)" },
    { label: "Inbound Terbuka", value: openInbound.length, color: "#d97706" },
    { label: "Outbound Terbuka", value: openOutbound.length, color: "#7c3aed" },
  ];

  return (
    <div className="page">
      <PageHeader
        actions={
          <span className="status blue" style={{ fontSize: "0.75rem" }}>
            <Eye size={12} /> View Only
          </span>
        }
        description="Monitoring inventori dan aktivitas gudang — akses baca saja."
        eyebrow="Viewer dashboard"
        icon={Eye}
        title="Monitoring Inventori"
      />

      <section className="grid grid-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Stok Saat Ini</div>
            <div className="section-subtitle">Posisi inventori aktif per LPN</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "lpn", header: "LPN", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)" }}>{r.lpnCode}</span> },
            { key: "mat", header: "Material", render: (r) => r.materialDescription },
            { key: "lot", header: "Lot", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#d97706" }}>{r.lotNumber}</span> },
            { key: "loc", header: "Lokasi", render: (r) => r.currentLocation },
            { key: "qty", header: "Qty (KG)", render: (r) => <strong>{formatKg(r.qtyCurrentKg)}</strong> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
          rows={stock.filter((r) => r.status !== "shipped")}
        />
      </section>

      <section className="grid grid-2">
        <div>
          <div className="section-header">
            <div className="section-title">Transaksi Terakhir</div>
          </div>
          <DataTable
            columns={[
              { key: "date", header: "Tanggal", render: (r) => <span style={{ fontSize: "0.8rem" }}>{r.date}</span> },
              { key: "doc", header: "Dokumen", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--navy)" }}>{r.docNo}</span> },
              { key: "type", header: "Tipe", render: (r) => <span style={{ fontSize: "0.8rem" }}>{r.transactionType}</span> },
              { key: "qty", header: "Qty", render: (r) => formatKg(r.movementQtyKg) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.statusAfter} /> },
            ]}
            rows={recent}
          />
        </div>
        <div>
          <div className="section-header">
            <div className="section-title">ASN Inbound</div>
          </div>
          <DataTable
            columns={[
              { key: "doc", header: "ASN", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)" }}>{r.docNo}</span> },
              { key: "supplier", header: "Supplier", render: (r) => r.supplier },
              { key: "qty", header: "KG", render: (r) => formatKg(r.totalQtyKg) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={inboundDocuments}
          />
        </div>
      </section>
    </div>
  );
}
