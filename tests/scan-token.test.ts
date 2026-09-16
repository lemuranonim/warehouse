import { describe, expect, it } from "vitest";
import { parseScanToken } from "../lib/scan-token";

describe("scan token normalization", () => {
  it("normalizes raw scanner values", () => {
    expect(parseScanToken("  lpn-001  ")).toBe("LPN-001");
  });

  it("extracts the final path from an issued QR URL", () => {
    expect(parseScanToken("https://wms.example.com/s/a7k9q2?source=label")).toBe("A7K9Q2");
  });

  it("rejects empty or malformed encoded tokens", () => {
    expect(parseScanToken("   ")).toBe("");
    expect(parseScanToken("%E0%A4%A")).toBe("");
  });
});
