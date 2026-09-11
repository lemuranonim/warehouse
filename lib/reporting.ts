import {
  deliveryNotes,
  inboundDocuments,
  outboundOrders,
  type DeliveryNote,
  type InboundDocument,
} from "@/lib/demo-data";

export type WarehouseDocumentLine = {
  lineNo: number;
  materialCode: string;
  materialDescription: string;
  lotNumber: string;
  qtyKg: number;
  uom: "KG";
  remark: string;
};

export type DocumentSignoff = {
  role: "Warehouse In-Charge" | "Transporter" | "Receiver" | "Data Entry Receiving";
  name: string;
  date: string;
};

export type WarehouseDocument = {
  kind: "incoming" | "delivery";
  title: "INCOMING NOTE" | "DELIVERY NOTE";
  docNo: string;
  documentDate: string;
  fromParty: string;
  toParty: string;
  address: string;
  truckId: string;
  preparedBy: string;
  doNo: string;
  lines: WarehouseDocumentLine[];
  totalQtyKg: number;
  linePrecision: number;
  totalPrecision: number;
  signoffs: DocumentSignoff[];
  documentControl: {
    documentNo: string;
    edition: string;
    revision: string;
    effectiveDate: string;
    copies: string[];
  };
};

const documentControl = {
  documentNo: "PK-WHS-01-F1",
  edition: "02",
  revision: "00",
  effectiveDate: "01.09.2023",
  copies: ["Admin", "Receiver", "Transporter", "Sender", "Archive"],
};

function formatDocumentDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date).replaceAll(" ", "-");
}

export function buildIncomingReport(source: InboundDocument): WarehouseDocument {
  const documentDate = formatDocumentDate(source.asnDate);
  const lines = source.lines.map((line) => ({
    lineNo: line.lineNo,
    materialCode: line.materialCode,
    materialDescription: line.materialDescription,
    lotNumber: line.lotNumber,
    qtyKg: line.receivedQtyKg > 0 ? line.receivedQtyKg : line.expectedQtyKg,
    uom: "KG" as const,
    remark: line.status === "variance" ? "Qty variance" : "-",
  }));

  return {
    kind: "incoming",
    title: "INCOMING NOTE",
    docNo: source.docNo,
    documentDate,
    fromParty: source.supplier,
    toParty: "Advanta Seeds Warehouse",
    address: "-",
    truckId: "-",
    preparedBy: source.createdBy,
    doNo: source.docNo,
    lines,
    totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0),
    linePrecision: 2,
    totalPrecision: 2,
    signoffs: [
      { role: "Warehouse In-Charge", name: "-", date: documentDate },
      { role: "Transporter", name: "-", date: documentDate },
      { role: "Receiver", name: "-", date: documentDate },
      { role: "Data Entry Receiving", name: source.createdBy, date: documentDate },
    ],
    documentControl,
  };
}

export function buildDeliveryReport(source: DeliveryNote): WarehouseDocument {
  const documentDate = formatDocumentDate(source.dnDate);
  const outbound = outboundOrders.find((order) => order.docNo === source.outboundDocNo);
  const lines = source.lines.map((line, index) => ({
    lineNo: index + 1,
    materialCode: line.materialCode,
    materialDescription: line.materialDescription,
    lotNumber: line.lotNumber,
    qtyKg: line.qtyKg,
    uom: "KG" as const,
    remark: line.status,
  }));

  return {
    kind: "delivery",
    title: "DELIVERY NOTE",
    docNo: source.dnNo,
    documentDate,
    fromParty: "Advanta Seeds Warehouse",
    toParty: source.destination,
    address: "-",
    truckId: source.vehicle,
    preparedBy: outbound?.createdBy ?? "-",
    doNo: source.outboundDocNo,
    lines,
    totalQtyKg: lines.reduce((sum, line) => sum + line.qtyKg, 0),
    linePrecision: 2,
    totalPrecision: 2,
    signoffs: [
      { role: "Warehouse In-Charge", name: "-", date: documentDate },
      { role: "Transporter", name: source.driver, date: documentDate },
      { role: "Receiver", name: "-", date: documentDate },
      { role: "Data Entry Receiving", name: outbound?.createdBy ?? "-", date: documentDate },
    ],
    documentControl,
  };
}

export function getWarehouseReport(kind: WarehouseDocument["kind"], docNo: string) {
  if (kind === "incoming") {
    const source = inboundDocuments.find((document) => document.docNo === docNo);
    return source ? buildIncomingReport(source) : undefined;
  }

  const source = deliveryNotes.find((document) => document.dnNo === docNo);
  return source ? buildDeliveryReport(source) : undefined;
}
