import { notFound } from "next/navigation";
import { WarehouseDocumentPreview } from "@/components/warehouse-document-preview";
import { getWarehouseReport } from "@/lib/reporting";

type PageProps = { params: Promise<{ docNo: string }> };

export default async function IncomingDocumentPage({ params }: PageProps) {
  const { docNo } = await params;
  const document = getWarehouseReport("incoming", decodeURIComponent(docNo));
  if (!document) notFound();
  return <WarehouseDocumentPreview document={document} />;
}
