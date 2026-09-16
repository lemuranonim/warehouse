import { Database } from "lucide-react";
import { InventoryImportConsole } from "@/components/inventory-import-console";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { postInventoryBatchAction } from "@/app/actions/wms";
import { getInventoryBatchData } from "@/lib/wms-queries";

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

export default async function InventoryDatabasePage() {
  const { batches } = await getInventoryBatchData();
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
        <div className="section-header"><div><h2 className="section-title">Posting batch tervalidasi</h2><p className="section-subtitle">Tindakan ini membuat material, lot, LPN, token scan, dan movement inbound pada ledger.</p></div></div>
        <WmsActionForm action={postInventoryBatchAction} submitLabel="Post ke Ledger">
          <label className="wms-field wide"><span>Batch *</span><select name="inventory_batch_id" required><option value="">Pilih batch</option>{batches.filter(batch => ["uploaded", "validated"].includes(batch.status)).map(batch => <option key={batch.id} value={batch.id}>{batch.source_file} · {batch.source_sheet} · {batch.row_count} baris</option>)}</select></label>
        </WmsActionForm>
        <div className="inventory-message warning">Pastikan warehouse dan minimal satu lokasi receiving/storage untuk setiap nama warehouse pada workbook sudah dibuat sebelum posting.</div>
        <DataTable columns={[
          { key: "file", header: "File", render: row => row.source_file },
          { key: "sheet", header: "Sheet", render: row => row.source_sheet },
          { key: "warehouse", header: "Warehouse", render: row => row.warehouse ?? "-" },
          { key: "rows", header: "Rows", render: row => row.row_count },
          { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
          { key: "date", header: "Created", render: row => new Date(row.created_at).toLocaleString("id-ID") },
        ]} rows={batches} emptyMessage="Belum ada batch staging." />
      </section>

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
