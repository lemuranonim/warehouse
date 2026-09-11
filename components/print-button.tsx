"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button className="primary-button" type="button" onClick={() => window.print()}>
      <Printer aria-hidden size={16} /> Cetak / Simpan PDF
    </button>
  );
}
