import {
  Boxes,
  Database,
  History,
  MapPinned,
  PackagePlus,
  QrCode,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { WorkspaceLinkCard } from "@/components/workspace-link-card";
import { ADMIN_ROLES } from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";
import { getDashboardData } from "@/lib/supabase/queries";
import { getUserAccessData } from "@/lib/wms-queries";

const adminWorkspaces = [
  { href: "/admin/materials", title: "Master Material", description: "Tambah atau perbarui SKU", icon: Boxes, tone: "blue" as const },
  { href: "/admin/locations", title: "Master Lokasi", description: "Atur warehouse, rack, dan bin", icon: MapPinned, tone: "green" as const },
  { href: "/admin/stock-types", title: "Tipe Stok", description: "Kelola klasifikasi inventori", icon: Database, tone: "violet" as const },
  { href: "/admin/users", title: "Pengguna & Role", description: "Atur akses dan cakupan warehouse", icon: Users, tone: "amber" as const },
  { href: "/admin/inbound", title: "Order Inbound", description: "Buat ASN barang masuk", icon: PackagePlus, tone: "green" as const },
  { href: "/admin/labels", title: "Cetak Label LPN", description: "Preview dan cetak QR label", icon: QrCode, tone: "blue" as const },
  { href: "/admin/outbound", title: "Order Outbound", description: "Buat order dan alokasi FEFO", icon: Truck, tone: "amber" as const },
  { href: "/admin/inventory", title: "Database Inventori", description: "Import dan posting data awal", icon: Database, tone: "violet" as const },
  { href: "/admin/audit", title: "Transaksi & Audit", description: "Telusuri movement dan aktivitas", icon: History, tone: "blue" as const },
];

export default async function AdminPage() {
  await requirePageAccess(ADMIN_ROLES);
  const [dashboard, userData] = await Promise.all([getDashboardData(), getUserAccessData()]);
  const activeUsers = userData.profiles.filter((profile) => profile.is_active).length;

  return (
    <div className="page">
      <PageHeader
        actions={<span className={`status ${dashboard.source === "live" ? "green" : "amber"}`}>{dashboard.source === "live" ? "DATABASE LIVE" : dashboard.source.toUpperCase()}</span>}
        eyebrow="Administrasi WMS"
        icon={ShieldCheck}
        title="Panel Admin Warehouse"
        description="Kelola master data, akses pengguna, dokumen, dan inventori dari satu tempat."
      />

      <section className="grid grid-4">
        <MetricCard helper="SKU aktif" icon={Boxes} label="Material" tone="blue" value={String(dashboard.metrics.materialCount)} />
        <MetricCard helper="Lokasi terdaftar" icon={MapPinned} label="Lokasi" tone="green" value={String(dashboard.metrics.locationCount)} />
        <MetricCard helper="Akun aktif" icon={Users} label="Pengguna" tone="amber" value={String(activeUsers)} />
        <MetricCard helper="Role tersedia" icon={ShieldCheck} label="Role" tone="violet" value={String(userData.roles.length)} />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Pilih Fitur</h2>
            <p className="section-subtitle">Langsung buka area yang akan dikelola.</p>
          </div>
        </div>
        <div className="workspace-link-grid">
          {adminWorkspaces.map((workspace) => <WorkspaceLinkCard key={workspace.href} {...workspace} />)}
        </div>
      </section>
    </div>
  );
}
