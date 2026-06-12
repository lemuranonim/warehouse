import { Printer, QrCode } from "lucide-react";
import { LabelPreview } from "@/components/label-preview";
import { PageHeader } from "@/components/page-header";

export default function LabelsPage() {
  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="primary-button" type="button">
              <QrCode aria-hidden size={18} /> Generate QR
            </button>
            <button className="secondary-button" type="button">
              <Printer aria-hidden size={18} /> Print Label
            </button>
          </>
        }
        eyebrow="Label printing"
        icon={QrCode}
        title="LPN Label Printing"
        description="Print or reprint LPN labels with SKU, lot, quantity, inventory status, and scan code."
      />
      <LabelPreview />
    </div>
  );
}
