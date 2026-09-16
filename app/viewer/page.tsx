import { Eye } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatKg } from "@/lib/format";
import { getDashboardData } from "@/lib/supabase/queries";

export default async function ViewerPage() {
  const { metrics, currentStock, movements, source } = await getDashboardData();
  return <div className="page">
    <PageHeader actions={<span className="status blue"><Eye size={12} /> View Only · {source.toUpperCase()}</span>} eyebrow="Viewer dashboard" icon={Eye} title="Monitoring Inventori" description="Akses read-only terhadap saldo dan transaksi operasional terbaru." />
    <section className="grid grid-4">{[
      ["On Hand KG", formatKg(metrics.totalStockKg)], ["Available KG", formatKg(metrics.availableStockKg)], ["Active LPN", metrics.activeLpnCount], ["Transactions", metrics.movementCount],
    ].map(([label,value]) => <article className="card" key={label}><span className="eyebrow">{label}</span><strong className="inventory-metric">{value}</strong></article>)}</section>
    <section className="section"><DataTable columns={[
      { key: "lpn", header: "LPN", render: row => <span className="mono-strong">{row.lpnCode}</span> },
      { key: "material", header: "Material", render: row => row.materialDescription },
      { key: "lot", header: "Lot", render: row => row.lotNumber },
      { key: "location", header: "Location", render: row => row.currentLocation },
      { key: "qty", header: "Qty", render: row => `${formatKg(row.qtyCurrentKg)} KG` },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.status} /> },
    ]} rows={currentStock} /></section>
    <section className="section"><DataTable columns={[
      { key: "date", header: "Date", render: row => row.date }, { key: "type", header: "Transaction", render: row => row.transactionType },
      { key: "lpn", header: "LPN", render: row => row.lpnCode }, { key: "qty", header: "Movement", render: row => `${formatKg(row.movementQtyKg)} KG` },
    ]} rows={movements.slice(0,50)} /></section>
  </div>;
}
