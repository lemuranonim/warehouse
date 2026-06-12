import { MapPinned, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { locations } from "@/lib/demo-data";
import { formatKg } from "@/lib/format";

export default function LocationsPage() {
  return (
    <div className="page">
      <PageHeader
        actions={
          <button className="primary-button" type="button">
            <Plus aria-hidden size={18} /> New Location
          </button>
        }
        eyebrow="Location master"
        icon={MapPinned}
        title="Warehouse Location Master"
        description="Maintain receiving areas, storage bins, staging lanes, loading docks, capacity, and active location status."
      />
      <DataTable
        columns={[
          { key: "code", header: "Location", render: (row) => row.locationCode },
          { key: "site", header: "Site", render: (row) => row.site },
          { key: "warehouse", header: "Warehouse", render: (row) => row.warehouse },
          { key: "type", header: "Location Type", render: (row) => <StatusBadge value={row.locationType} /> },
          { key: "capacity", header: "Capacity", render: (row) => `${formatKg(row.capacityKg)} KG` },
          { key: "active", header: "Active", render: (row) => <StatusBadge value={row.isActive ? "active" : "inactive"} /> }
        ]}
        rows={locations}
      />
    </div>
  );
}
