import { PackagePlus, Printer, Upload } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { inboundDocuments } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function InboundPage() {
  const allLines = inboundDocuments.flatMap((doc) =>
    doc.lines.map((line) => ({ ...line, docNo: doc.docNo, supplier: doc.supplier }))
  );

  const counts = {
    total: inboundDocuments.length,
    planned: inboundDocuments.filter((d) => d.status === "planned").length,
    receiving: inboundDocuments.filter((d) => d.status === "receiving").length,
    received: inboundDocuments.filter((d) =>
      ["received", "closed"].includes(d.status)
    ).length,
  };

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="secondary-button" type="button">
              <Upload size={16} /> Upload ASN
            </button>
            <button className="primary-button" type="button">
              <PackagePlus size={16} /> Buat ASN Baru
            </button>
          </>
        }
        description="Buat, upload, dan kelola rencana penerimaan barang masuk ke gudang. Verifikasi per-line terhadap lot, qty, dan exp date."
        eyebrow="ASN / Inbound orders"
        icon={PackagePlus}
        title="Manajemen Inbound & ASN"
      />

      {/* Summary strip */}
      <section className="section">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Total ASN", value: counts.total, color: "var(--navy)" },
            { label: "Planned", value: counts.planned, color: "#d97706" },
            { label: "Receiving", value: counts.receiving, color: "#2563eb" },
            { label: "Received", value: counts.received, color: "var(--green)" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 10, padding: "14px 16px", textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ASN Document list */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Daftar ASN</div>
            <div className="section-subtitle">Semua inbound advance shipping notice</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "docNo", header: "ASN Doc", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.docNo}</span> },
            { key: "supplier", header: "Supplier", render: (r) => r.supplier },
            { key: "asnDate", header: "Tgl ASN", render: (r) => r.asnDate },
            { key: "expectedDate", header: "Expected", render: (r) => r.expectedDate },
            { key: "totalLines", header: "Lines", render: (r) => r.totalLines },
            { key: "totalQtyKg", header: "Total KG", render: (r) => <strong>{formatKg(r.totalQtyKg)}</strong> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "createdBy", header: "Dibuat", render: (r) => <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{r.createdBy}</span> },
          ]}
          rows={inboundDocuments}
        />
      </section>

      {/* Line Detail */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Detail Lines ASN</div>
            <div className="section-subtitle">Verifikasi per-material, lot, dan exp date</div>
          </div>
          <button className="secondary-button" type="button">
            <Printer size={14} /> Print Labels
          </button>
        </div>
        <DataTable
          columns={[
            { key: "docNo", header: "ASN Doc", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--navy)" }}>{r.docNo}</span> },
            { key: "lineNo", header: "Line", render: (r) => r.lineNo },
            { key: "mat", header: "Material", render: (r) => <span style={{ fontWeight: 600 }}>{r.materialDescription}</span> },
            { key: "lot", header: "Lot", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#d97706", fontWeight: 600 }}>{r.lotNumber}</span> },
            { key: "exp", header: "Exp Date", render: (r) => r.expDate },
            { key: "expected", header: "Exp KG", render: (r) => formatKg(r.expectedQtyKg) },
            { key: "received", header: "Received KG", render: (r) => (
              <span style={{ fontWeight: 700, color: r.receivedQtyKg === r.expectedQtyKg ? "var(--green)" : r.receivedQtyKg > 0 ? "#d97706" : "var(--muted)" }}>
                {formatKg(r.receivedQtyKg)}
              </span>
            )},
            { key: "variance", header: "Selisih KG", render: (r) => {
              const v = r.receivedQtyKg - r.expectedQtyKg;
              return <span style={{ fontWeight: 700, color: v === 0 ? "var(--green)" : v < 0 ? "#e53e3e" : "#d97706" }}>{v === 0 ? "\u2713 0" : formatKg(v)}</span>;
            }},
            { key: "stockType", header: "Tipe Stok", render: (r) => <span className="status blue" style={{ fontSize: "0.72rem" }}>{r.stockType}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
          rows={allLines}
        />
      </section>
    </div>
  );
}
