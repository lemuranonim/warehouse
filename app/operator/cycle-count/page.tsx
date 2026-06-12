"use client";
import { useState } from "react";
import { ClipboardCheck, Database, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { cycleCountSessions } from "@/lib/demo-data";
import { formatKg, formatStatusLabel } from "@/lib/format";

export default function CycleCountPage() {
  const [selectedId, setSelectedId] = useState(cycleCountSessions[1].sessionId);
  const session = cycleCountSessions.find((s) => s.sessionId === selectedId) ?? cycleCountSessions[0];

  const totalLines = session.lines.length;
  const counted = session.lines.filter((l) => l.status !== "pending").length;
  const pending = session.lines.filter((l) => l.status === "pending").length;
  const variance = session.lines.filter((l) => l.variance !== null && l.variance !== 0).length;

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="secondary-button" type="button">Tutup Sesi</button>
            <button className="primary-button" type="button"><Plus size={16} /> Buka Sesi Baru</button>
          </>
        }
        description="Buka sesi count, scan lokasi, input qty aktual, dan submit selisih untuk persetujuan supervisor."
        eyebrow="Cycle counts"
        icon={Database}
        title="Cycle Count & Verifikasi Stok"
      />

      {/* Session Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {cycleCountSessions.map((s) => (
            <button
              key={s.sessionId}
              type="button"
              onClick={() => setSelectedId(s.sessionId)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line)",
                background: selectedId === s.sessionId ? "var(--navy)" : "var(--surface)",
                color: selectedId === s.sessionId ? "#fff" : "var(--ink)",
                fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
              }}
            >
              {s.sessionId} &mdash; <span style={{ opacity: 0.7 }}>{formatStatusLabel(s.status)}</span>
            </button>
          ))}
        </div>

        {/* Session Info */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Session ID</span><br /><strong style={{ fontFamily: "monospace", color: "var(--navy)" }}>{session.sessionId}</strong></div>
          <div><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Dibuka</span><br /><strong>{session.openDate}</strong></div>
          <div><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Status</span><br /><StatusBadge value={session.status} /></div>
          <div><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Scope</span><br /><strong style={{ fontFamily: "monospace" }}>{session.scope}</strong></div>
          <div><span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Dibuka Oleh</span><br /><strong>{session.openedBy}</strong></div>
        </div>
      </section>

      {/* Summary */}
      <section className="section">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Total Lines", value: totalLines, color: "var(--navy)" },
            { label: "Dihitung", value: counted, color: "var(--green)" },
            { label: "Belum Dihitung", value: pending, color: "#d97706" },
            { label: "Ada Selisih", value: variance, color: "#e53e3e" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN: System vs Actual Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Perbandingan Sistem vs Aktual</div>
            <div className="section-subtitle">Input qty aktual per LPN di setiap lokasi</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "loc", header: "Lokasi", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.locationCode}</span> },
            { key: "lpn", header: "LPN", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)" }}>{r.lpnCode}</span> },
            { key: "mat", header: "Material", render: (r) => <span style={{ fontSize: "0.82rem" }}>{r.materialDescription}</span> },
            { key: "lot", header: "Lot", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#d97706" }}>{r.lotNumber}</span> },
            { key: "book", header: "Qty Sistem (KG)", render: (r) => <span style={{ fontWeight: 700, color: "#2563eb" }}>{formatKg(r.bookQtyKg)}</span> },
            { key: "actual", header: "Qty Aktual (KG)", render: (r) => r.countedQtyKg !== null
              ? <span style={{ fontWeight: 700, color: "var(--green)" }}>{formatKg(r.countedQtyKg)}</span>
              : <span className="status amber" style={{ fontSize: "0.72rem" }}>Belum Dihitung</span>
            },
            { key: "variance", header: "Selisih (KG)", render: (r) => {
              if (r.variance === null) return <span style={{ color: "var(--muted)" }}>—</span>;
              const v = r.variance;
              return <span style={{ fontWeight: 700, color: v === 0 ? "var(--green)" : v < 0 ? "#e53e3e" : "#d97706" }}>{v === 0 ? "\u2713 0" : formatKg(v)}</span>;
            }},
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "action", header: "", render: (r) => r.status === "pending"
              ? <button className="primary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Input Qty</button>
              : null
            },
          ]}
          rows={session.lines}
        />
      </section>

      <section className="section">
        <ScannerConsole />
      </section>

      {/* Session History */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">Riwayat Sesi Count</div>
        </div>
        <DataTable
          columns={[
            { key: "id", header: "Session ID", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.sessionId}</span> },
            { key: "open", header: "Dibuka", render: (r) => r.openDate },
            { key: "close", header: "Ditutup", render: (r) => r.closeDate ?? <span style={{ color: "var(--muted)" }}>—</span> },
            { key: "scope", header: "Scope", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{r.scope}</span> },
            { key: "lines", header: "Lines", render: (r) => r.lines.length },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
          rows={cycleCountSessions}
        />
      </section>
    </div>
  );
}
