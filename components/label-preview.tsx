import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const label = {
  lpn: "LPN-20260520-000020",
  sku: "152000198",
  lot: "NPCCA0090",
  qty: "1,000.000 KG",
  inventoryType: "Fresh Seed",
  inboundRef: "IN-04251112",
  status: "Available",
  token: "A7K9Q2"
};

export function LabelPreview() {
  const scanBaseUrl = (process.env.NEXT_PUBLIC_WMS_BASE_URL ?? "https://wms.domainmu.com").replace(/\/$/, "");
  const scanUrl = `${scanBaseUrl}/s/${label.token}`;

  return (
    <div className="label-preview">
      <div>
        <p className="eyebrow">LPN Label</p>
        <h2>{label.lpn}</h2>
        <div className="grid grid-2">
          <LabelField label="SKU" value={label.sku} />
          <LabelField label="Lot" value={label.lot} />
          <LabelField label="Qty" value={label.qty} />
          <LabelField label="Inventory Type" value={label.inventoryType} />
          <LabelField label="Inbound Ref" value={label.inboundRef} />
          <LabelField label="Status" value={label.status} />
        </div>
      </div>
      <div>
        <div className="qr-box" aria-label={`Generated QR code for ${label.lpn}`}>
          <QRCodeSVG
            bgColor="transparent"
            fgColor="#0d1f40"
            includeMargin={false}
            level="M"
            size={124}
            value={scanUrl}
          />
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Scan code: {label.token}
        </p>
        <p className="small" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <QrCode aria-hidden size={15} /> Token {label.token}
        </p>
        <p className="small muted" style={{ marginTop: 8, wordBreak: "break-all" }}>
          {scanUrl}
        </p>
      </div>
    </div>
  );
}

function LabelField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="muted small" style={{ marginBottom: 2 }}>
        {label}
      </p>
      <strong>{value}</strong>
    </div>
  );
}
