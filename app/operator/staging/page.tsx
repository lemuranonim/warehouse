import { MapPin, ScanLine, Truck } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";
import { StatusBadge } from "@/components/status-badge";
import { currentStock, deliveryNotes, locations } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function StagingPage() {
  const stock = currentStock();
  const pickedLpns = stock.filter((s) => s.status === "picked");
  const stagedLpns = stock.filter((s) => s.status === "staged");
  const stagingLocations = locations.filter((l) =>
    ["staging", "loading"].includes(l.locationType)
  );
  const pendingDns = deliveryNotes.filter((d) => d.status !== "dispatched");

  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <ScanLine size={16} /> Scan Staging
          </button>
        }
        description="Pindahkan LPN dari area picking ke staging lane sebelum dispatch. Scan LPN dan lokasi staging untuk konfirmasi perpindahan."
        eyebrow="Staging area"
        icon={MapPin}
        title="Manajemen Staging & Persiapan Pengiriman"
      />

      {/* Summary */}
      <section className="section">
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "LPN Dipick", value: pickedLpns.length, color: "#2563eb" },
            { label: "LPN di Staging", value: stagedLpns.length, color: "#d97706" },
            { label: "DN Pending", value: pendingDns.length, color: "var(--navy)" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Scanner */}
      <section className="section">
        <ScannerConsole />
      </section>

      <section className="grid grid-2">
        {/* LPN Pending Staging */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">LPN Siap Di-Staging</div>
              <div className="section-subtitle">LPN status picked — perlu dipindah ke staging</div>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "lpn", header: "LPN", render: (r) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)", fontWeight: 700 }}>{r.lpnCode}</span> },
              { key: "mat", header: "Material", render: (r) => <span style={{ fontSize: "0.82rem" }}>{r.materialDescription}</span> },
              { key: "loc", header: "Lokasi", render: (r) => r.currentLocation },
              { key: "qty", header: "KG", render: (r) => formatKg(r.qtyCurrentKg) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
              { key: "action", header: "", render: (r) => (
                r.status === "picked"
                  ? <button className="primary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 10px" }}>Konfirmasi</button>
                  : <button className="secondary-button" type="button" style={{ fontSize: "0.75rem", padding: "5px 10px" }}>View</button>
              )},
            ]}
            rows={[...pickedLpns, ...stagedLpns]}
          />
        </div>

        {/* Staging Locations */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Lokasi Staging & Dock</div>
              <div className="section-subtitle">Area staging dan loading dock</div>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "code", header: "Kode", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.locationCode}</span> },
              { key: "room", header: "Area", render: (r) => r.room },
              { key: "capacity", header: "Kapasitas", render: (r) => `${formatKg(r.capacityKg)} KG` },
              { key: "type", header: "Tipe", render: (r) => <StatusBadge value={r.locationType} /> },
            ]}
            rows={stagingLocations}
          />

          {/* Pending DN */}
          <div className="section-header" style={{ marginTop: 20 }}>
            <div>
              <div className="section-title">Delivery Note Menunggu</div>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "dnNo", header: "DN No", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--navy)" }}>{r.dnNo}</span> },
              { key: "destination", header: "Tujuan", render: (r) => r.destination },
              { key: "driver", header: "Driver", render: (r) => r.driver },
              { key: "qty", header: "Total KG", render: (r) => formatKg(r.totalQtyKg) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
            rows={pendingDns}
          />
        </div>
      </section>
    </div>
  );
}
