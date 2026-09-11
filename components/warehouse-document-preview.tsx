import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import type { WarehouseDocument } from "@/lib/reporting";

function formatQuantity(value: number, precision: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function WarehouseDocumentPreview({ document }: { document: WarehouseDocument }) {
  const backHref = document.kind === "incoming" ? "/admin/inbound" : "/admin/outbound";

  return (
    <div className="document-page">
      <div className="document-toolbar no-print">
        <Link className="secondary-button" href={backHref}>
          <ArrowLeft aria-hidden size={16} /> Kembali
        </Link>
        <div>
          <span className="document-source-label">Laporan dari data WMS · format PDF warehouse</span>
          <PrintButton />
        </div>
      </div>

      <article className={`document-preview ${document.kind}`}>
        <header className="document-heading">
          <div className="document-brand">
            <Image src="/logo_wh.png" alt="Advanta Seeds" width={148} height={58} priority />
            <span>PT. ADVANTA SEEDS INDONESIA</span>
          </div>
          <h1>{document.title}</h1>
        </header>

        <section className="document-meta" aria-label="Informasi dokumen">
          <dl>
            <div><dt>From</dt><dd>{document.fromParty}</dd></div>
            <div><dt>Date</dt><dd>{document.documentDate}</dd></div>
            <div><dt>Doc No</dt><dd className="document-number">{document.docNo}</dd></div>
            <div><dt>DO No</dt><dd>{document.doNo}</dd></div>
          </dl>
          <dl>
            <div><dt>To</dt><dd>{document.toParty}</dd></div>
            <div><dt>Address</dt><dd>{document.address}</dd></div>
            <div><dt>Truck ID</dt><dd>{document.truckId}</dd></div>
            <div><dt>Prepare by</dt><dd>{document.preparedBy}</dd></div>
          </dl>
        </section>

        <div className="document-table-wrap">
          <table className="document-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>MATERIAL CODE</th>
                <th>DESCRIPTION</th>
                <th>LOT</th>
                <th>QTY</th>
                <th>UOM</th>
                <th>REMARK</th>
              </tr>
            </thead>
            <tbody>
              {document.lines.map((line) => (
                <tr key={`${document.docNo}-${line.lineNo}`}>
                  <td>{line.lineNo}</td>
                  <td>{line.materialCode}</td>
                  <td>{line.materialDescription}</td>
                  <td>{line.lotNumber}</td>
                  <td className="qty">{formatQuantity(line.qtyKg, document.linePrecision)}</td>
                  <td>{line.uom}</td>
                  <td>{line.remark}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={4}>Total</th>
                <th className="qty">{formatQuantity(document.totalQtyKg, document.totalPrecision)}</th>
                <th colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="document-signoffs" aria-label="Serah terima">
          {document.signoffs.map((signoff) => (
            <div key={signoff.role}>
              <strong>{signoff.role}</strong>
              <span className="signature-space" aria-hidden />
              <dl>
                <div><dt>Name</dt><dd>{signoff.name}</dd></div>
                <div><dt>Date</dt><dd>{signoff.date}</dd></div>
              </dl>
            </div>
          ))}
        </section>

        <footer className="document-footer">
          <div className="document-control">
            <span>Document No : {document.documentControl.documentNo}</span>
            <span>Edition No: {document.documentControl.edition}</span>
            <span>Revision No: {document.documentControl.revision}</span>
            <span>Effective Date: {document.documentControl.effectiveDate}</span>
          </div>
          <ol>
            {document.documentControl.copies.map((copy) => <li key={copy}>{copy}</li>)}
          </ol>
        </footer>
      </article>
    </div>
  );
}
