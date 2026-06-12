"use client";
import { useState } from "react";
import { ClipboardList, Package, Truck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { currentStock, outboundOrders } from "@/lib/demo-data";
import { formatKg, formatStatusLabel } from "@/lib/format";

export default function OutboundPage() {
  const [activeTab, setActiveTab] = useState("all");
  const stock = currentStock();
  const availableStock = stock.filter((s) => s.status === "available");

  const allLines = outboundOrders.flatMap((order) =>
    order.lines.map((line) => ({ ...line, orderDocNo: order.docNo, orderStatus: order.status, destination: order.destination }))
  );

  const filtered = activeTab === "all"
    ? outboundOrders
    : outboundOrders.filter((o) => o.status === activeTab);

  const counts = {
    total: outboundOrders.length,
    draft: outboundOrders.filter((o) => o.status === "draft").length,
    allocated: outboundOrders.filter((o) => ["allocated", "picking", "staged"].includes(o.status)).length,
    dispatched: outboundOrders.filter((o) => o.status === "dispatched").length,
  };

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="secondary-button" type="button">Release All</button>
            <button className="primary-button" type="button"><ClipboardList size={16} /> New Order</button>
          </>
        }
        description="Buat outbound order, alokasikan stok tersedia ke picking task, dan pantau progress pengiriman."
        eyebrow="Outbound orders"
        icon={Truck}
        title="Manajemen Order Keluar & Alokasi Stok"
      />

      {/* Summary */}
      <section className="section">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Total Order", value: counts.total, color: "var(--navy)" },
            { label: "Draft", value: counts.draft, color: "#d97706" },
            { label: "Dialokasikan", value: counts.allocated, color: "#2563eb" },
            { label: "Dispatched", value: counts.dispatched, color: "var(--green)" },
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
          {["all", "draft", "released", "allocated", "dispatched"].map((tab) => (
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
            { key: "docNo", header: "Doc No", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.docNo}</span> },
            { key: "orderDate", header: "Tgl Order", render: (r) => r.orderDate },
            { key: "requestedDate", header: "Requested", render: (r) => r.requestedDate },
            { key: "destination", header: "Tujuan", render: (r) => r.destination },
            { key: "lines", header: "Lines", render: (r) => r.totalLines },
            { key: "qty", header: "Total KG", render: (r) => <strong>{formatKg(r.totalQtyKg)}</strong> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "action", header: "", render: (r) => (
              r.status === "draft" ? <button className="secondary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Release</button>
              : r.status === "released" ? <button className="primary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Alokasikan</button>
              : <button className="secondary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>View Pick</button>
            )},
          ]}
          rows={filtered}
        />
      </section>

      {/* Allocation Lines */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Stock Allocation — Detail Lines</div>
            <div className="section-subtitle">Detail alokasi LPN per line order outbound</div>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "order", header: "Order", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--navy)" }}>{r.orderDocNo}</span> },
            { key: "line", header: "Line", render: (r) => r.lineNo },
            { key: "mat", header: "Material", render: (r) => <span style={{ fontWeight: 600 }}>{r.materialDescription}</span> },
            { key: "dest", header: "Tujuan", render: (r) => <span style={{ fontSize: "0.8rem" }}>{r.destination}</span> },
            { key: "reqQty", header: "Diminta KG", render: (r) => formatKg(r.requestedQtyKg) },
            { key: "allocQty", header: "Dialokasi KG", render: (r) => (
              <span style={{ fontWeight: 700, color: r.allocatedQtyKg > 0 ? "var(--green)" : "#d97706" }}>{formatKg(r.allocatedQtyKg)}</span>
            )},
            { key: "lpn", header: "LPN Assigned", render: (r) => r.lpnCode
              ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--navy)" }}>{r.lpnCode}</span>
              : <span style={{ color: "var(--muted)" }}>—</span>
            },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
          rows={allLines}
        />
      </section>

      {/* Available Stock for Allocation */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Available Stock untuk Alokasi</div>
            <div className="section-subtitle">Pilih LPN available untuk dialokasikan ke outbound order</div>
          </div>
        </div>
        <div style={{ background: "#1aba6a12", border: "1px solid #1aba6a40", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: "0.82rem", color: "var(--green)" }}>
          <strong>&#x2139; Info:</strong> Pilih LPN available di bawah untuk dialokasikan ke outbound order yang belum teralokasi.
        </div>
        <DataTable
          columns={[
            { key: "lpn", header: "LPN Code", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.lpnCode}</span> },
            { key: "mat", header: "Material", render: (r) => r.materialDescription },
            { key: "lot", header: "Lot", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#d97706" }}>{r.lotNumber}</span> },
            { key: "loc", header: "Lokasi", render: (r) => r.currentLocation },
            { key: "qty", header: "Qty Available (KG)", render: (r) => <strong style={{ color: "var(--green)", fontSize: "1rem" }}>{formatKg(r.qtyCurrentKg)}</strong> },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            { key: "action", header: "", render: () => <button className="secondary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 12px" }}>Alokasikan</button> },
          ]}
          rows={availableStock}
        />
      </section>
    </div>
  );
}
