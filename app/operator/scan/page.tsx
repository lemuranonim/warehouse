import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";

export default function ScannerPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Scanner Warehouse"
        icon={ScanLine}
        title="Scan Barcode & QR"
        description="Pilih jenis pekerjaan, lalu scan LPN, lokasi, material, atau dokumen."
      />
      <ScannerConsole />
    </div>
  );
}
