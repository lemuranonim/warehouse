import { Database, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { stockTypes } from "@/lib/demo-data";

const colorMap: Record<string, string> = {
  green: "#0d9668",
  blue: "#2563eb",
  amber: "#d97706",
  red: "#dc2626",
  violet: "#7c3aed",
  cyan: "#0891b2",
};

export default function StockTypesPage() {
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <Plus size={16} /> Tambah Tipe
          </button>
        }
        description="Klasifikasi jenis benih untuk manajemen stok, laporan, dan aturan penanganan."
        eyebrow="Stock type master"
        icon={Database}
        title="Tipe Stok Benih"
      />

      <section className="grid grid-3">
        {stockTypes.map((type) => (
          <div
            key={type.code}
            className="card"
            style={{ borderTop: `3px solid ${colorMap[type.color] ?? "var(--navy)"}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `${colorMap[type.color] ?? "var(--navy)"}18`,
                display: "grid", placeItems: "center",
                fontSize: "0.75rem", fontWeight: 800,
                color: colorMap[type.color] ?? "var(--navy)",
                fontFamily: "monospace"
              }}>
                {type.code}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>{type.label}</div>
                <StatusBadge value={type.isActive ? "active" : "inactive"} />
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>{type.description}</p>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Semua Tipe Stok</div>
            <div className="section-subtitle">Detail konfigurasi tipe stok benih</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "code", header: "Kode", render: (row) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{row.code}</span> },
            { key: "label", header: "Label", render: (row) => <strong>{row.label}</strong> },
            { key: "description", header: "Deskripsi", render: (row) => row.description },
            { key: "color", header: "Warna", render: (row) => (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: colorMap[row.color] ?? "gray", display: "inline-block" }} />
                {row.color}
              </span>
            )},
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} /> },
          ]}
          rows={stockTypes}
        />
      </section>
    </div>
  );
}
