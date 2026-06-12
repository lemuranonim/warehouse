import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { scanLinks } from "@/lib/demo-data";

type PageProps = {
  params: Promise<{ token: string }> | { token: string };
};

export default async function ScanTokenPage({ params }: PageProps) {
  const { token } = await params;
  const resolved = scanLinks.find((link) => link.token.toLowerCase() === token.toLowerCase());

  return (
    <div className="page">
      <PageHeader
        eyebrow="Scan result"
        icon={QrCode}
        title={resolved ? `${resolved.entityCode}` : `Token ${token} not found`}
        description="Review the scanned reference, then continue to the right WMS task."
      />
      <section className="card">
        {resolved ? (
          <>
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="eyebrow">{resolved.entityType}</p>
                <h2>{resolved.entityCode}</h2>
              </div>
              <StatusBadge value={resolved.status} />
            </div>
            <p className="lead">{resolved.title}</p>
            <p className="muted">{resolved.subtitle}</p>
            <div className="toolbar" style={{ marginTop: 16 }}>
              <Link className="primary-button" href="/operator/scan">
                Open Scan Workstation <ArrowRight aria-hidden size={18} />
              </Link>
              <Link className="secondary-button" href="/operator/lookup">
                Inventory Lookup
              </Link>
            </div>
          </>
        ) : (
          <p className="lead">This scan code is inactive, voided, or not registered.</p>
        )}
      </section>
    </div>
  );
}
