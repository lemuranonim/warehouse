import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { inspectXlsxArchive } from "../lib/xlsx-safety";

describe("XLSX archive inspection", () => {
  it("accepts a normal Excel workbook", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("P01").addRow(["Warehouse", "Material"]);
    const output = Buffer.from(await workbook.xlsx.writeBuffer());

    expect(inspectXlsxArchive(output)).toMatchObject({ entryCount: expect.any(Number) });
  });

  it("rejects a renamed non-XLSX payload", () => {
    expect(() => inspectXlsxArchive(Buffer.from("not an xlsx archive"))).toThrow("INVALID_XLSX_SIGNATURE");
  });
});
