import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScannerConsole } from "@/components/scanner-console";

export default function ScannerPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Scan workstation"
        icon={ScanLine}
        title="Execute warehouse scans by task type."
        description="Select a scan mode, capture an LPN, location, SKU, or document barcode, then continue with the validated WMS task."
      />
      <ScannerConsole />
    </div>
  );
}
