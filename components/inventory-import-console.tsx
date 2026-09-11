"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatKg } from "@/lib/format";
import type { InventoryImportPreview } from "@/lib/inventory-import-types";

export function InventoryImportConsole() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InventoryImportPreview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeWorkbook() {
    if (!file) {
      setError("Pilih workbook .xlsx terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/inventory/import", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Workbook tidak dapat dibaca.");
      setPreview(result as InventoryImportPreview);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Workbook tidak dapat dibaca.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="inventory-import-card">
        <div className="inventory-import-copy">
          <span className="eyebrow">Sumber database historis</span>
          <h2>Validasi workbook warehouse</h2>
          <p>
            Pilih file Excel database manual. Sistem membaca sheet stok dan Product List,
            menormalkan field, lalu menandai data yang perlu dibenahi sebelum migrasi.
          </p>
        </div>

        <div className="inventory-file-panel">
          <label className="inventory-file-picker" htmlFor="inventory-workbook">
            <FileSpreadsheet aria-hidden size={24} />
            <span>
              <strong>{file?.name ?? "Pilih workbook .xlsx"}</strong>
              <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Maksimum 20 MB"}</small>
            </span>
          </label>
          <input
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            id="inventory-workbook"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setError("");
            }}
            type="file"
          />
          <button className="primary-button" disabled={loading || !file} onClick={analyzeWorkbook} type="button">
            {loading ? <LoaderCircle className="spin" aria-hidden size={16} /> : <Upload aria-hidden size={16} />}
            {loading ? "Membaca workbook..." : "Baca & Validasi"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="inventory-message error" role="alert">
          <AlertTriangle aria-hidden size={18} /> {error}
        </div>
      ) : null}

      {preview ? (
        <>
          <div className="inventory-message success">
            <CheckCircle2 aria-hidden size={18} />
            <span><strong>{preview.fileName}</strong> berhasil dibaca. Hasil berikut masih berupa staging dan belum mengubah stok WMS.</span>
          </div>

          <section className="grid grid-4">
            {[
              { label: "Baris Inventory", value: preview.totals.inventoryRows.toLocaleString("id-ID"), helper: `${preview.totals.warehouseCount} warehouse · ${preview.totals.blockedRows} blocked` },
              { label: "Master Material", value: preview.totals.materialMasterRows.toLocaleString("id-ID"), helper: "Product List" },
              { label: "Referensi SAP", value: preview.totals.sapReferenceRows.toLocaleString("id-ID"), helper: "Pembanding rekonsiliasi" },
              { label: "Total Snapshot", value: `${formatKg(preview.totals.totalQtyKg)} KG`, helper: "Belum diposting" },
            ].map((item) => (
              <article className="card" key={item.label}>
                <span className="eyebrow">{item.label}</span>
                <strong className="inventory-metric">{item.value}</strong>
                <span className="muted small">{item.helper}</span>
              </article>
            ))}
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Ringkasan per Sheet</h2>
                <p className="section-subtitle">Sheet asli tetap dicatat sebagai jejak audit setiap batch import.</p>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "sheet", header: "Sheet", render: (row) => <strong>{row.name}</strong> },
                { key: "kind", header: "Jenis", render: (row) => ({ inventory_snapshot: "Snapshot Inventory", material_master: "Master Material", sap_reference: "Referensi SAP", legacy_archive: "Arsip Lama" })[row.kind] },
                { key: "included", header: "Migrasi", render: (row) => row.includedInMigration ? <StatusBadge value="included" /> : <span className="muted">Tidak ditambahkan</span> },
                { key: "source", header: "Baris Sumber", render: (row) => row.sourceRows.toLocaleString("id-ID") },
                { key: "accepted", header: "Terbaca", render: (row) => row.acceptedRows.toLocaleString("id-ID") },
                { key: "blocked", header: "Blocked", render: (row) => row.blockedRows ? <StatusBadge value={`${row.blockedRows} blocked`} /> : "0" },
                { key: "skipped", header: "Kosong/Dilewati", render: (row) => row.skippedRows.toLocaleString("id-ID") },
              ]}
              rows={preview.sheets}
            />
            <div className="inventory-notices">
              {preview.notices.map((notice) => <p key={notice}>• {notice}</p>)}
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Preview Normalisasi Inventory</h2>
                <p className="section-subtitle">Menampilkan maksimum 100 baris pertama untuk pemeriksaan pemetaan.</p>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "source", header: "Sumber", render: (row) => <span className="status blue">{row.sourceSheet} · {row.sourceRow}</span> },
                { key: "date", header: "Tanggal", render: (row) => row.stockDate ?? "-" },
                { key: "material", header: "Material", render: (row) => <span className="mono-strong">{row.materialCode || "-"}</span> },
                { key: "description", header: "Description", render: (row) => row.materialDescription || "-" },
                { key: "lot", header: "Batch / Lot", render: (row) => <span className="lot-code">{row.lotNumber || "-"}</span> },
                { key: "qty", header: "Qty (KG)", render: (row) => row.qtyKg === null ? "-" : <strong>{formatKg(row.qtyKg)}</strong> },
                { key: "warehouse", header: "WH", render: (row) => row.warehouse || "-" },
                { key: "stage", header: "Stage", render: (row) => row.stage || "-" },
                { key: "result", header: "Validasi", render: (row) => <StatusBadge value={row.validationResult} /> },
                { key: "message", header: "Catatan", render: (row) => row.validationMessage || "Siap staging" },
              ]}
              rows={preview.inventoryPreview}
              emptyMessage="Tidak ada baris inventory yang terbaca."
            />
          </section>

          <div className="inventory-notices">
            {preview.notices.map((notice) => <p key={notice}>• {notice}</p>)}
          </div>
        </>
      ) : null}
    </>
  );
}
