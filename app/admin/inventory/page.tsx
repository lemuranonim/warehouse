import { Database } from "lucide-react";
import { InventoryImportConsole } from "@/components/inventory-import-console";
import { PageHeader } from "@/components/page-header";

const fieldMappings = [
  ["Date", "stock_date", "Tanggal snapshot"],
  ["Material Code / Material", "material_code", "Kunci master material"],
  ["Material Description / Description", "material_description", "Nama material sumber"],
  ["Hybrid · Stage · Flagging", "hybrid · stage · flagging", "Atribut produk"],
  ["Batch No / Lot Number", "lot_number", "Kunci lot"],
  ["Qty (kg) / Stock (kg)", "qty_kg", "Saldo snapshot"],
  ["WH / Location", "warehouse", "Gudang sumber"],
  ["Type · Product · Crop · Status", "material_type · product · crop · inventory_status", "Klasifikasi"],
  ["Return/Non Return · Ageing · SAP", "return_classification · ageing_days · sap_qty_kg", "Kontrol rekonsiliasi"],
  ["Note · Action · Remark", "note · remark", "Catatan tindak lanjut"],
];

export default function InventoryDatabasePage() {
  return (
    <div className="page">
      <PageHeader
        description="Migrasikan database manual warehouse dari workbook Excel ke staging yang tervalidasi sebelum direkonsiliasi dengan ledger WMS."
        eyebrow="Migrasi database lama"
        icon={Database}
        title="Import & Rekonsiliasi Inventory"
      />

      <InventoryImportConsole />

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Pemetaan Kolom Workbook</h2>
            <p className="section-subtitle">Mendukung P01, P02 Latest, P02, KA01, KS01, SAP, dan Product List.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Kolom Excel</th><th>Field WMS</th><th>Fungsi</th></tr>
            </thead>
            <tbody>
              {fieldMappings.map(([source, target, purpose]) => (
                <tr key={source}>
                  <td><strong>{source}</strong></td>
                  <td><span className="mono-strong">{target}</span></td>
                  <td>{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
