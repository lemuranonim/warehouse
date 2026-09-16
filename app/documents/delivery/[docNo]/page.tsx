import { notFound } from "next/navigation";
import { WarehouseDocumentPreview } from "@/components/warehouse-document-preview";
import { getWarehouseReport } from "@/lib/reporting";

type PageProps = { params: Promise<{ docNo: string }> };

export default async function DeliveryDocumentPage({ params }: PageProps) {
  const { docNo } = await params;
  const document = await getWarehouseReport("delivery", decodeURIComponent(docNo));
  if (!document) notFound();
  return <WarehouseDocumentPreview document={document} />;
}
