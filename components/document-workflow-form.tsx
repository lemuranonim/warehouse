"use client";

import { useState } from "react";
import type { WmsAction } from "@/components/wms-action-form";
import { WmsActionForm } from "@/components/wms-action-form";

type MaterialOption = { code: string; label: string };
type Line = { material_code: string; lot_number: string; qty_kg: string; exp_date: string; stock_type: string; remark: string };

const blankLine = (stockType = "Fresh Seed"): Line => ({ material_code: "", lot_number: "", qty_kg: "", exp_date: "", stock_type: stockType, remark: "" });

export function DocumentWorkflowForm({
  action, kind, materials, stockTypes = [], warehouses = [],
}: {
  action: WmsAction;
  kind: "inbound" | "outbound";
  materials: MaterialOption[];
  stockTypes?: string[];
  warehouses?: string[];
}) {
  const [lines, setLines] = useState<Line[]>([blankLine(stockTypes[0])]);
  const update = (index: number, key: keyof Line, value: string) => setLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  const payload = lines.map((line, index) => kind === "inbound" ? {
    line_no: index + 1, material_code: line.material_code, lot_number: line.lot_number,
    planned_qty_kg: Number(line.qty_kg), exp_date: line.exp_date || null,
    stock_type: line.stock_type || "Fresh Seed", remark: line.remark || null, uom: "KG",
  } : {
    line_no: index + 1, material_code: line.material_code, lot_number: line.lot_number || null,
    requested_qty_kg: Number(line.qty_kg), remark: line.remark || null, uom: "KG",
  });

  return <WmsActionForm action={action} submitLabel={kind === "inbound" ? "Buat ASN" : "Buat Order"}>
    <label className="wms-field"><span>Nomor Dokumen *</span><input name="doc_no" placeholder={kind === "inbound" ? "Contoh: ASN-2026-0001" : "Contoh: OUT-2026-0001"} required /></label>
    <label className="wms-field"><span>Tanggal</span><input name="document_date" type="date" /></label>
    {kind === "inbound" ? <>
      <label className="wms-field"><span>Pengirim</span><input name="sender" placeholder="Nama pemasok atau asal barang" /></label>
      <label className="wms-field"><span>Tujuan</span><input defaultValue="Advanta Seeds Warehouse" name="destination" /></label>
    </> : <>
      <label className="wms-field"><span>Warehouse Asal</span><select name="origin"><option value="">Pilih warehouse</option>{warehouses.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="wms-field"><span>Tujuan Pengiriman</span><input name="destination" placeholder="Nama atau kota tujuan" /></label>
    </>}
    <input name="items_json" type="hidden" value={JSON.stringify(payload)} />
    <div className="document-lines-editor">
      {lines.map((line, index) => <div className="document-line-row" key={index}>
        <strong>Baris {index + 1}</strong>
        <label className="wms-field"><span>Material *</span><select required value={line.material_code} onChange={event => update(index, "material_code", event.target.value)}><option value="">Pilih material</option>{materials.map(material => <option key={material.code} value={material.code}>{material.code} — {material.label}</option>)}</select></label>
        <label className="wms-field"><span>Lot {kind === "inbound" ? "*" : "(kosong = FEFO)"}</span><input placeholder={kind === "inbound" ? "Nomor lot" : "Opsional"} required={kind === "inbound"} value={line.lot_number} onChange={event => update(index, "lot_number", event.target.value)} /></label>
        <label className="wms-field"><span>Kuantitas (KG) *</span><input min="0.001" placeholder="0.000" required step="0.001" type="number" value={line.qty_kg} onChange={event => update(index, "qty_kg", event.target.value)} /></label>
        {kind === "inbound" ? <>
          <label className="wms-field"><span>Exp Date</span><input type="date" value={line.exp_date} onChange={event => update(index, "exp_date", event.target.value)} /></label>
          <label className="wms-field"><span>Stock Type</span><select value={line.stock_type} onChange={event => update(index, "stock_type", event.target.value)}>{stockTypes.map(value => <option key={value}>{value}</option>)}</select></label>
        </> : null}
        <label className="wms-field"><span>Catatan</span><input placeholder="Opsional" value={line.remark} onChange={event => update(index, "remark", event.target.value)} /></label>
        {lines.length > 1 ? <button className="secondary-button" onClick={() => setLines(current => current.filter((_, lineIndex) => lineIndex !== index))} type="button">Hapus</button> : null}
      </div>)}
      <button className="secondary-button" disabled={lines.length >= 100} onClick={() => setLines(current => [...current, blankLine(stockTypes[0])])} type="button">+ Tambah Baris</button>
    </div>
  </WmsActionForm>;
}
