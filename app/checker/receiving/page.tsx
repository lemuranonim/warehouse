"use client";
import { useState } from "react";
import { ClipboardCheck, ScanLine } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { inboundDocuments } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

const TABS = ["Semua", "planned", "receiving", "received"] as const;

export default function ReceivingPage() {
  const [activeTab, setActiveTab] = useState<string>("Semua");

  const filtered = activeTab === "Semua"
    ? inboundDocuments
    : inboundDocuments.filter((d) => d.status === activeTab);

  const allLines = inboundDocuments.flatMap((doc) =>
    doc.lines.map((line) => ({ ...line, docNo: doc.docNo }))
  );

  const checklistItems = [
    "Cek material code sesuai ASN",
    "Cek lot number sesuai dokumen pengiriman",
    "Cek tanggal kadaluarsa (exp date)",
    "Cek kondisi fisik kemasan",
    "Timbang dan catat qty aktual",
    "Foto/scan dokumen pengiriman",
    "Konfirmasi penerimaan ke sistem",
  ];

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="secondary-button" type="button">Scan Dokumen</button>
            <button className="primary-button" type="button"><ScanLine size={16} /> Confirm Receipt</button>
          </>
        }
        description="Verifikasi setiap line ASN: material, lot number, tanggal kadaluarsa, dan kuantitas aktual. Catat selisih penerimaan."
        eyebrow="Goods receiving"
        icon={ClipboardCheck}
        title="Verifikasi Penerimaan Barang"
      />

      {/* Filter Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 16px", borderRadius: 8,
                border: "1px solid var(--line)",
                background: activeTab === tab ? "var(--navy)" : "var(--surface)",
                color: activeTab === tab ? "#fff" : "var(--ink)",
                fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                textTransform: tab === "Semua" ? "none" : "capitalize"
              }}
            >
              {tab === "Semua" ? "Semua" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 6, opacity: 0.7, fontSize: "0.75rem" }}>
                ({tab === "Semua" ? inboundDocuments.length : inboundDocuments.filter((d) => d.status === tab).length})
              </span>
            </button>
          ))}
        </div>

        <DataTable
          columns={[
            { key: "docNo", header: "ASN Doc", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.docNo}</span> },
            { key: "supplier", header: "Supplier", render: (r) => r.supplier },
            { key: "asnDate", header: "Tgl ASN", render: (r) => r.asnDate },
            { key: "expected", header: "Expected", render: (r) => r.expectedDate },
            { key: "lines", header: "Lines", render: (r) => r.totalLines },
            { key: "qty", header: "Total KG", render: (r) => <strong>{formatKg(r.totalQtyKg)}</strong> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
          rows={filtered}
        />
      </section>

      {/* Per-line verification */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Verifikasi Per Line</div>
            <div className="section-subtitle">Verifikasi detail material, lot, exp date, dan kuantitas aktual</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "docNo", header: "ASN Doc", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--navy)" }}>{r.docNo}</span> },
            { key: "mat", header: "Material", render: (r) => <span style={{ fontWeight: 600 }}>{r.materialDescription}</span> },
            { key: "lot", header: "Lot Number", render: (r) => (
              <span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700, color: "#d97706", background: "#d9770610", padding: "2px 8px", borderRadius: 5 }}>
                {r.lotNumber}
              </span>
            )},
            { key: "exp", header: "Exp Date", render: (r) => (
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.expDate}</span>
            )},
            { key: "stockType", header: "Tipe Stok", render: (r) => <span className="status blue" style={{ fontSize: "0.72rem" }}>{r.stockType}</span> },
            { key: "expected", header: "Exp KG", render: (r) => formatKg(r.expectedQtyKg) },
            { key: "received", header: "Actual KG", render: (r) => (
              <span style={{ fontWeight: 700, color: r.receivedQtyKg === r.expectedQtyKg ? "var(--green)" : r.receivedQtyKg > 0 ? "#d97706" : "var(--muted)" }}>
                {formatKg(r.receivedQtyKg)}
              </span>
            )},
            { key: "variance", header: "Selisih", render: (r) => {
              const v = r.receivedQtyKg - r.expectedQtyKg;
              return <span style={{ fontWeight: 700, color: v === 0 ? "var(--green)" : "#e53e3e" }}>{v === 0 ? "\u2713" : formatKg(v)}</span>;
            }},
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "action", header: "", render: (r) => (
              r.status === "pending" || r.status === "partial"
                ? <button className="primary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Verifikasi</button>
                : null
            )},
          ]}
          rows={allLines}
        />
      </section>

      {/* Checklist */}
      <section className="section">
        <div className="grid grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 16, fontSize: "0.9rem" }}>
              \u2714 Checklist Penerimaan Barang
            </div>
            {checklistItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < checklistItems.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid var(--green)", background: "#0d966810", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: "var(--green)", fontSize: "0.7rem", fontWeight: 900 }}>\u2713</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 12, fontSize: "0.9rem" }}>Ringkasan Penerimaan</div>
            {[
              { label: "Total ASN", value: inboundDocuments.length },
              { label: "Total Lines", value: inboundDocuments.reduce((s, d) => s + d.lines.length, 0) },
              { label: "Total Qty Expected", value: formatKg(inboundDocuments.reduce((s, d) => s + d.totalQtyKg, 0)) + " KG" },
              { label: "Lines Received", value: allLines.filter((l) => l.status === "received").length },
              { label: "Lines Variance", value: allLines.filter((l) => l.status === "variance").length },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--muted)" }}>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
