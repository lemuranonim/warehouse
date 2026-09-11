import ExcelJS, { type Cell, type Worksheet } from "exceljs";
import { NextResponse } from "next/server";
import type {
  InventoryImportPreview,
  InventoryImportRow,
  InventorySheetSummary,
} from "@/lib/inventory-import-types";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
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
    if (qtyKg !== null && qtyKg < 0) validationMessages.push("Qty negatif perlu ditinjau");

    const blockingMessages = validationMessages.filter((message) =>
      !message.includes("negatif")
    );
    const validationResult = blockingMessages.length > 0
      ? "blocked"
      : validationMessages.length > 0
        ? "warning"
        : "valid";

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

function countProductMasterRows(sheet: Worksheet) {
  const columns = buildColumnMap(sheet);
  const materialColumn = findColumn(columns, "materialCode");
  if (!materialColumn) return { acceptedRows: 0, blockedRows: 0, skippedRows: Math.max(0, sheet.actualRowCount - 2) };

  let acceptedRows = 0;
  let skippedRows = 0;
  for (let rowNumber = 3; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    if (cellText(sheet.getRow(rowNumber).getCell(materialColumn))) acceptedRows += 1;
    else skippedRows += 1;
  }
  return { acceptedRows, blockedRows: 0, skippedRows };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Pilih file workbook .xlsx terlebih dahulu." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "Format yang didukung adalah .xlsx." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Ukuran workbook melebihi batas 20 MB." }, { status: 413 });
    }

    const workbook = new ExcelJS.Workbook();
    const workbookData = Buffer.from(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(workbookData);

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
    const productSheet = workbook.getWorksheet(PRODUCT_SHEET);
    if (productSheet) {
      const productCounts = countProductMasterRows(productSheet);
      materialMasterRows = productCounts.acceptedRows;
      summaries.push({
        name: PRODUCT_SHEET,
        kind: "material_master",
        includedInMigration: true,
        sourceRows: Math.max(0, productSheet.actualRowCount - 2),
        ...productCounts,
      });
    } else {
      missingSheets.push(PRODUCT_SHEET);
    }

    const warehouses = new Set(inventoryRows.map((row) => row.warehouse).filter(Boolean));
    const preview: InventoryImportPreview = {
      fileName: file.name,
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

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workbook tidak dapat dibaca.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
