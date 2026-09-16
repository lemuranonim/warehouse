import ExcelJS, { type Cell, type Worksheet } from "exceljs";
import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { INVENTORY_IMPORT_ROLES } from "@/lib/access-control";
import { authorizeApi } from "@/lib/auth";
import type {
  InventoryImportPreview,
  InventoryImportRow,
  InventorySheetSummary,
} from "@/lib/inventory-import-types";
import { checkInMemoryRateLimit } from "@/lib/rate-limit";
import { inspectXlsxArchive, XLSX_MIME_TYPE } from "@/lib/xlsx-safety";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const configuredMaxBytes = Number(process.env.WMS_IMPORT_MAX_BYTES ?? 20 * 1024 * 1024);
const MAX_FILE_BYTES = Number.isFinite(configuredMaxBytes)
  ? Math.min(Math.max(configuredMaxBytes, 1024 * 1024), 25 * 1024 * 1024)
  : 20 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 1024 * 1024;
const MAX_SHEETS = 50;
const MAX_ROWS_PER_SHEET = 20_000;
const MAX_COLUMNS_PER_SHEET = 150;
const MAX_TOTAL_ROWS = 60_000;
const INVENTORY_SHEETS = ["P01", "P02 Latest", "KA01", "KS01"];
const LEGACY_SHEET = "P02";
const SAP_SHEET = "SAP";
const PRODUCT_SHEET = "Product List";

const headerAliases = {
  stockDate: ["date"],
  materialCode: ["materialcode", "material"],
  materialDescription: ["materialdescription", "description"],
  hybrid: ["hybrid"],
  stage: ["stage"],
  flagging: ["flagging"],
  lotNumber: ["batchno", "lotnumber", "batchlot"],
  qtyKg: ["qtykg", "stockkg", "stock"],
  warehouse: ["wh", "warehouse", "location"],
  materialType: ["type"],
  product: ["product"],
  crop: ["crop"],
  inventoryStatus: ["status"],
  returnClassification: ["returnnonreturn", "returnclassification"],
  ageingDays: ["ageingdays", "ageing"],
  sapQtyKg: ["sap"],
  note: ["note"],
  remark: ["remark", "action"],
} as const;

type FieldName = keyof typeof headerAliases;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rawCellValue(cell: Cell) {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) return value.result;
  return value;
}

function cellText(cell: Cell) {
  const value = rawCellValue(cell);
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return cell.text.trim();
  return String(value).trim();
}

function cellNumber(cell: Cell) {
  const value = rawCellValue(cell);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = cellText(cell).replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function cellDate(cell: Cell) {
  const value = rawCellValue(cell);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000 && value < 80000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86400000).toISOString().slice(0, 10);
  }

  const text = cellText(cell);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function buildColumnMap(sheet: Worksheet) {
  const map = new Map<string, number>();
  sheet.getRow(2).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeHeader(cell.text);
    if (header) map.set(header, columnNumber);
  });
  return map;
}

function findColumn(map: Map<string, number>, field: FieldName) {
  for (const alias of headerAliases[field]) {
    const column = map.get(alias);
    if (column) return column;
  }
  return null;
}

function defaultWarehouse(sheetName: string) {
  if (sheetName === "P01") return "Prasad 01";
  if (sheetName === "P02" || sheetName === "P02 Latest") return "Prasad CS";
  if (sheetName === "KA01") return "Kiat Ananda CS01";
  if (sheetName === "KS01") return "Kunci Logistic";
  return "";
}

function parseInventorySheet(sheet: Worksheet) {
  const columns = buildColumnMap(sheet);
  const getCell = (rowNumber: number, field: FieldName) => {
    const column = findColumn(columns, field);
    return column ? sheet.getRow(rowNumber).getCell(column) : sheet.getRow(rowNumber).getCell(1);
  };
  const rows: InventoryImportRow[] = [];
  let skippedRows = 0;

  for (let rowNumber = 3; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const materialCode = cellText(getCell(rowNumber, "materialCode"));
    const lotNumber = cellText(getCell(rowNumber, "lotNumber"));
    const qtyKg = cellNumber(getCell(rowNumber, "qtyKg"));

    if (!materialCode && !lotNumber && qtyKg === null) {
      skippedRows += 1;
      continue;
    }

    const warehouse = cellText(getCell(rowNumber, "warehouse")) || defaultWarehouse(sheet.name);
    const validationMessages: string[] = [];
    if (!materialCode) validationMessages.push("Material Code kosong");
    if (!lotNumber) validationMessages.push("Batch/Lot kosong");
    if (qtyKg === null) validationMessages.push("Qty bukan angka");
    if (!warehouse) validationMessages.push("Warehouse kosong");
    if (qtyKg !== null && qtyKg <= 0) validationMessages.push("Qty harus lebih besar dari nol");
    const validationResult = validationMessages.length > 0 ? "blocked" : "valid";

    rows.push({
      sourceSheet: sheet.name,
      sourceRow: rowNumber,
      stockDate: cellDate(getCell(rowNumber, "stockDate")),
      materialCode,
      materialDescription: cellText(getCell(rowNumber, "materialDescription")),
      hybrid: cellText(getCell(rowNumber, "hybrid")),
      stage: cellText(getCell(rowNumber, "stage")),
      flagging: cellText(getCell(rowNumber, "flagging")),
      lotNumber,
      qtyKg,
      warehouse,
      materialType: cellText(getCell(rowNumber, "materialType")),
      product: cellText(getCell(rowNumber, "product")),
      crop: cellText(getCell(rowNumber, "crop")),
      inventoryStatus: cellText(getCell(rowNumber, "inventoryStatus")),
      returnClassification: cellText(getCell(rowNumber, "returnClassification")),
      ageingDays: cellNumber(getCell(rowNumber, "ageingDays")),
      sapQtyKg: cellNumber(getCell(rowNumber, "sapQtyKg")),
      note: cellText(getCell(rowNumber, "note")),
      remark: cellText(getCell(rowNumber, "remark")),
      validationResult,
      validationMessage: validationMessages.join("; "),
    });
  }

  return { rows, skippedRows };
}

function parseProductMasterRows(sheet: Worksheet) {
  const columns = buildColumnMap(sheet);
  const materialColumn = findColumn(columns, "materialCode");
  if (!materialColumn) return { rows: [] as Array<Record<string, string>>, acceptedRows: 0, blockedRows: 0, skippedRows: Math.max(0, sheet.actualRowCount - 2) };

  const rows: Array<Record<string, string>> = [];
  let acceptedRows = 0;
  let skippedRows = 0;
  for (let rowNumber = 3; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const materialCode = cellText(sheet.getRow(rowNumber).getCell(materialColumn));
    if (!materialCode) { skippedRows += 1; continue; }
    const value = (field: FieldName) => { const column = findColumn(columns, field); return column ? cellText(sheet.getRow(rowNumber).getCell(column)) : ""; };
    rows.push({
      material_code: materialCode, material_description: value("materialDescription"), hybrid: value("hybrid"),
      stage: value("stage"), flagging: value("flagging"), material_type: value("materialType"),
      product: value("product"), crop: value("crop"), inventory_status: value("inventoryStatus"),
    });
    acceptedRows += 1;
  }
  return { rows, acceptedRows, blockedRows: 0, skippedRows };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const authorization = await authorizeApi(INVENTORY_IMPORT_ROLES);
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.status === 401 ? "Silakan login terlebih dahulu." : "Role Anda tidak diizinkan mengimpor inventory." },
        { status: authorization.status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
      );
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: "Origin permintaan tidak diizinkan." },
        { status: 403, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
      );
    }

    const rateLimit = checkInMemoryRateLimit(`inventory-import:${authorization.access.userId}`, 5, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba kembali beberapa saat lagi." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
            "X-Request-Id": requestId,
          },
        },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_MULTIPART_BYTES) {
      return NextResponse.json(
        { error: "Ukuran permintaan melebihi batas yang diizinkan." },
        { status: 413, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode") === "stage" ? "stage" : "preview";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Pilih file workbook .xlsx terlebih dahulu." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "Format yang didukung adalah .xlsx." }, { status: 400 });
    }
    if (file.type && file.type !== XLSX_MIME_TYPE && file.type !== "application/octet-stream") {
      return NextResponse.json({ error: "Content-Type file tidak sesuai format XLSX." }, { status: 400 });
    }
    if (file.size < 22) {
      return NextResponse.json({ error: "Workbook kosong atau tidak valid." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Ukuran workbook melebihi batas 20 MB." }, { status: 413 });
    }

    const workbookData = Buffer.from(await file.arrayBuffer());
    inspectXlsxArchive(workbookData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookData as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    if (workbook.worksheets.length > MAX_SHEETS) throw new Error("WORKBOOK_LIMIT_EXCEEDED");
    let workbookRowCount = 0;
    for (const sheet of workbook.worksheets) {
      workbookRowCount += sheet.actualRowCount;
      if (sheet.actualRowCount > MAX_ROWS_PER_SHEET || sheet.actualColumnCount > MAX_COLUMNS_PER_SHEET) {
        throw new Error("WORKSHEET_LIMIT_EXCEEDED");
      }
    }
    if (workbookRowCount > MAX_TOTAL_ROWS) throw new Error("WORKBOOK_LIMIT_EXCEEDED");

    const inventoryRows: InventoryImportRow[] = [];
    const summaries: InventorySheetSummary[] = [];
    const missingSheets: string[] = [];

    for (const sheetName of INVENTORY_SHEETS) {
      const sheet = workbook.getWorksheet(sheetName);
      if (!sheet) {
        missingSheets.push(sheetName);
        continue;
      }
      const parsed = parseInventorySheet(sheet);
      inventoryRows.push(...parsed.rows);
      summaries.push({
        name: sheetName,
        kind: "inventory_snapshot",
        includedInMigration: true,
        sourceRows: Math.max(0, sheet.actualRowCount - 2),
        acceptedRows: parsed.rows.length,
        blockedRows: parsed.rows.filter((row) => row.validationResult === "blocked").length,
        skippedRows: parsed.skippedRows,
      });
    }

    let legacyArchiveRows = 0;
    const legacySheet = workbook.getWorksheet(LEGACY_SHEET);
    if (legacySheet) {
      const parsed = parseInventorySheet(legacySheet);
      legacyArchiveRows = parsed.rows.length;
      summaries.push({
        name: LEGACY_SHEET,
        kind: "legacy_archive",
        includedInMigration: false,
        sourceRows: Math.max(0, legacySheet.actualRowCount - 2),
        acceptedRows: parsed.rows.length,
        blockedRows: parsed.rows.filter((row) => row.validationResult === "blocked").length,
        skippedRows: parsed.skippedRows,
      });
    } else {
      missingSheets.push(LEGACY_SHEET);
    }

    let sapReferenceRows = 0;
    const sapSheet = workbook.getWorksheet(SAP_SHEET);
    if (sapSheet) {
      const parsed = parseInventorySheet(sapSheet);
      sapReferenceRows = parsed.rows.length;
      summaries.push({
        name: SAP_SHEET,
        kind: "sap_reference",
        includedInMigration: false,
        sourceRows: Math.max(0, sapSheet.actualRowCount - 2),
        acceptedRows: parsed.rows.length,
        blockedRows: parsed.rows.filter((row) => row.validationResult === "blocked").length,
        skippedRows: parsed.skippedRows,
      });
    } else {
      missingSheets.push(SAP_SHEET);
    }

    let materialMasterRows = 0;
    let productMasterRows: Array<Record<string, string>> = [];
    const productSheet = workbook.getWorksheet(PRODUCT_SHEET);
    if (productSheet) {
      const productCounts = parseProductMasterRows(productSheet);
      materialMasterRows = productCounts.acceptedRows;
      productMasterRows = productCounts.rows;
      summaries.push({
        name: PRODUCT_SHEET,
        kind: "material_master",
        includedInMigration: true,
        sourceRows: Math.max(0, productSheet.actualRowCount - 2),
        acceptedRows: productCounts.acceptedRows,
        blockedRows: productCounts.blockedRows,
        skippedRows: productCounts.skippedRows,
      });
    } else {
      missingSheets.push(PRODUCT_SHEET);
    }

    const warehouses = new Set(inventoryRows.map((row) => row.warehouse).filter(Boolean));
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._ ()-]/g, "_").slice(0, 180);
    const preview: InventoryImportPreview = {
      fileName: safeFileName,
      generatedAt: new Date().toISOString(),
      totals: {
        inventoryRows: inventoryRows.length,
        validRows: inventoryRows.filter((row) => row.validationResult === "valid").length,
        warningRows: inventoryRows.filter((row) => row.validationResult === "warning").length,
        blockedRows: inventoryRows.filter((row) => row.validationResult === "blocked").length,
        materialMasterRows,
        sapReferenceRows,
        legacyArchiveRows,
        totalQtyKg: inventoryRows.reduce((sum, row) => sum + (row.qtyKg ?? 0), 0),
        warehouseCount: warehouses.size,
      },
      sheets: summaries,
      inventoryPreview: inventoryRows.slice(0, 100),
      notices: [
        "Preview ini belum mengubah saldo stok WMS.",
        "Posting database dilakukan setelah baris blocked diselesaikan dan hasil rekonsiliasi disetujui.",
        "P02 diperlakukan sebagai arsip karena P02 Latest tersedia; SAP dipakai sebagai pembanding, bukan ditambahkan ke saldo fisik.",
        ...(missingSheets.length ? [`Sheet tidak ditemukan: ${missingSheets.join(", ")}.`] : []),
      ],
    };

    if (mode === "stage") {
      if (preview.totals.blockedRows > 0) {
        return NextResponse.json({ error: `Terdapat ${preview.totals.blockedRows} baris blocked. Perbaiki workbook sebelum staging.` }, { status: 422 });
      }
      const supabase = await createServerSupabaseClient();
      const stagedBatches: Array<{ id: string; sheet: string; rows: number }> = [];
      if (productMasterRows.length) {
        const materialHash = createHash("sha256").update(workbookData).update(`\0${PRODUCT_SHEET}`).digest("hex");
        const { data: materialBatchId, error: materialError } = await supabase.rpc("wms_import_material_master", {
          source_file_name: safeFileName, source_sheet_name: PRODUCT_SHEET,
          file_content_hash: materialHash, rows_payload: productMasterRows,
        });
        if (materialError) throw new Error(`MATERIAL_STAGE_FAILED:${materialError.message}`);
        stagedBatches.push({ id: materialBatchId, sheet: PRODUCT_SHEET, rows: productMasterRows.length });
      }
      for (const sheetName of INVENTORY_SHEETS) {
        const rows = inventoryRows.filter((row) => row.sourceSheet === sheetName);
        if (!rows.length) continue;
        const warehousesInSheet = [...new Set(rows.map((row) => row.warehouse).filter(Boolean))];
        const contentHash = createHash("sha256").update(workbookData).update(`\0${sheetName}`).digest("hex");
        const rowsPayload = rows.map((row) => ({
          source_row: row.sourceRow, stock_date: row.stockDate, material_code: row.materialCode,
          material_description: row.materialDescription, hybrid: row.hybrid, stage: row.stage,
          flagging: row.flagging, lot_number: row.lotNumber, qty_kg: row.qtyKg,
          warehouse: row.warehouse, material_type: row.materialType, product: row.product,
          crop: row.crop, inventory_status: row.inventoryStatus,
          return_classification: row.returnClassification, ageing_days: row.ageingDays,
          sap_qty_kg: row.sapQtyKg, note: row.note, remark: row.remark,
          validation_result: row.validationResult, validation_message: row.validationMessage,
        }));
        const { data: batchId, error: stageError } = await supabase.rpc("wms_stage_inventory_batch", {
          source_file_name: safeFileName, source_sheet_name: sheetName,
          warehouse_name: warehousesInSheet.length === 1 ? warehousesInSheet[0] : "MULTI",
          snapshot_date: rows.find((row) => row.stockDate)?.stockDate ?? null,
          file_content_hash: contentHash, rows_payload: rowsPayload,
        });
        if (stageError) throw new Error(`STAGE_FAILED:${sheetName}:${stageError.message}`);
        stagedBatches.push({ id: batchId, sheet: sheetName, rows: rows.length });
      }
      return NextResponse.json({ ...preview, stagedBatches, notices: [...preview.notices, "Batch tervalidasi sudah disimpan. Posting ledger tetap memerlukan konfirmasi terpisah."] }, {
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      });
    }

    return NextResponse.json(preview, {
      headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
    });
  } catch (error) {
    console.error(`[inventory-import:${requestId}]`, error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Workbook tidak dapat diproses. Periksa format, ukuran, dan struktur sheet.", requestId },
      { status: 400, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
    );
  }
}
