"use client";
import { useState } from "react";
import { ShieldCheck, Download } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { stockAdjustments, reasonCodes, statusRules } from "@/lib/demo-data";
import { formatKg, formatStatusLabel } from "@/lib/format";

export default function AdjustmentsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? stockAdjustments
    : stockAdjustments.filter((a) => a.status === activeTab);

  const pending = stockAdjustments.filter((a) => a.status === "pending").length;
  const approved = stockAdjustments.filter((a) => a.status === "approved").length;
  const rejected = stockAdjustments.filter((a) => a.status === "rejected").length;

  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="secondary-button" type="button">
            <Download size={16} /> Export Laporan
          </button>
        }
        description="Review selisih cycle count, pilih reason code, dan approve atau reject penyesuaian inventori."
        eyebrow="Stock adjustments"
        icon={ShieldCheck}
        title="Persetujuan Penyesuaian Stok"
      />

      {/* Summary */}
      <section className="section">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Pending Approval", value: pending, color: "#d97706" },
            { label: "Disetujui", value: approved, color: "var(--green)" },
            { label: "Ditolak", value: rejected, color: "#e53e3e" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "1px solid var(--line)",
                background: activeTab === tab ? "var(--navy)" : "var(--surface)",
                color: activeTab === tab ? "#fff" : "var(--ink)",
                fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", textTransform: "capitalize"
              }}
            >
              {tab === "all" ? "Semua" : formatStatusLabel(tab)}
            </button>
          ))}
        </div>

        <DataTable
          columns={[
            { key: "adjNo", header: "ADJ No", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.adjNo}</span> },
            { key: "lpn", header: "LPN", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)" }}>{r.lpnCode}</span> },
            { key: "mat", header: "Material", render: (r) => <span style={{ fontSize: "0.82rem" }}>{r.materialDescription}</span> },
            { key: "loc", header: "Lokasi", render: (r) => r.locationCode },
            { key: "book", header: "Qty Buku", render: (r) => <span style={{ color: "#2563eb" }}>{formatKg(r.bookQtyKg)}</span> },
            { key: "actual", header: "Qty Aktual", render: (r) => <span style={{ color: "#2563eb" }}>{formatKg(r.actualQtyKg)}</span> },
            { key: "variance", header: "Selisih", render: (r) => {
              const v = r.varianceKg;
              return <span style={{ fontWeight: 700, color: v === 0 ? "var(--green)" : v < 0 ? "#e53e3e" : "#d97706" }}>{v === 0 ? "\u2713 0" : formatKg(v)}</span>;
            }},
            { key: "reason", header: "Reason", render: (r) => (
              <span style={{ background: "#d9770614", color: "#d97706", borderRadius: 5, padding: "3px 8px", fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace" }}>
                {r.reasonCode}
              </span>
            )},
            { key: "submittedBy", header: "Disubmit", render: (r) => <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{r.submittedBy}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "actions", header: "", render: (r) => r.status === "pending" ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button className="primary-button" type="button" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>Approve</button>
                <button className="secondary-button" type="button" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>Reject</button>
              </div>
            ) : r.approvedBy ? <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>by {r.approvedBy}</span> : null },
          ]}
          rows={filtered}
        />
      </section>

      <section className="grid grid-2">
        {/* Reason Codes */}
        <div>
          <div className="section-header">
            <div className="section-title">Reason Codes</div>
            <div className="section-subtitle">Kode alasan penyesuaian stok</div>
          </div>
          <DataTable
            columns={[
              { key: "code", header: "Kode", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", background: "#7c3aed12", borderRadius: 5, padding: "2px 8px" }}>{r.code}</span> },
              { key: "label", header: "Keterangan", render: (r) => r.label },
            ]}
            rows={reasonCodes}
          />
        </div>

        {/* Status Rules */}
        <div>
          <div className="section-header">
            <div className="section-title">Aturan Status</div>
            <div className="section-subtitle">Alur perubahan status inventori</div>
          </div>
          <DataTable
            columns={[
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
              { key: "prev", header: "Dari", render: (r) => r.previous },
              { key: "next", header: "Ke", render: (r) => r.next },
              { key: "rule", header: "Aturan", render: (r) => <span style={{ fontSize: "0.8rem" }}>{r.rule}</span> },
            ]}
            rows={statusRules}
          />
        </div>
      </section>
    </div>
  );
}
