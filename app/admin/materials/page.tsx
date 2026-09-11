import { Boxes, Upload } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { materials } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function MaterialsPage() {
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <Upload aria-hidden size={18} /> Import Items
          </button>
        }
        eyebrow="Item master"
        icon={Boxes}
        title="Item Master"
        description="Maintain SKU, item description, crop, product group, status, and standard pack size for LPN creation."
      />
      <DataTable
        columns={[
          { key: "code", header: "SKU", render: (row) => row.materialCode },
          { key: "description", header: "Item Description", render: (row) => row.description },
          { key: "hybrid", header: "Hybrid", render: (row) => row.hybrid },
          { key: "stage", header: "Stage", render: (row) => row.stage },
          { key: "flagging", header: "Flagging", render: (row) => row.flagging || "-" },
          { key: "type", header: "Type", render: (row) => row.type },
          { key: "product", header: "Product", render: (row) => row.product },
          { key: "crop", header: "Crop", render: (row) => row.crop },
          { key: "package", header: "Pack Size", render: (row) => `${formatKg(row.standardPackageKg)} KG` },
          { key: "status", header: "Item Status", render: (row) => <StatusBadge value={row.status} /> }
        ]}
        rows={materials}
      />
    </div>
  );
}
