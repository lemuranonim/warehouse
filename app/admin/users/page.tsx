import { Users } from "lucide-react";
import { setUserAccessAction } from "@/app/actions/wms";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { WmsActionForm } from "@/components/wms-action-form";
import { getUserAccessData } from "@/lib/wms-queries";

export default async function UsersPage() {
  const { profiles, roles, assignments, warehouses } = await getUserAccessData();
  const roleById = new Map(roles.map(role => [role.id, role.name]));
  const userRoles = new Map<string, string[]>();
  for (const assignment of assignments) userRoles.set(assignment.user_id, [...(userRoles.get(assignment.user_id) ?? []), roleById.get(assignment.role_id) ?? "-"]);
  const rows = profiles.map(profile => ({ ...profile, roles: userRoles.get(profile.id) ?? [] }));
  return <div className="page">
    <PageHeader eyebrow="RBAC · live" icon={Users} title="User & Role Management" description="Aktifkan akun Auth yang sudah terdaftar, berikan role, dan batasi cakupan warehouse." />
    <section className="section"><WmsActionForm action={setUserAccessAction} submitLabel="Simpan Akses">
      <label className="wms-field"><span>Email Akun *</span><input name="user_email" placeholder="nama@advantaindonesia.com" required type="email" /></label>
      <label className="wms-field"><span>Nama Lengkap *</span><input name="profile_name" placeholder="Nama pengguna" required /></label>
      <label className="wms-field"><span>Role *</span><select name="role_name" required>{roles.map(role => <option key={role.id}>{role.name}</option>)}</select></label>
      <label className="wms-field"><span>Default warehouse</span><select name="default_warehouse"><option value="">Tidak dibatasi</option>{warehouses.map(w => <option key={w.id} value={w.warehouse_code}>{w.warehouse_code}</option>)}</select></label>
      <label className="wms-field wide"><span>Cakupan Warehouse</span><input defaultValue="All" name="warehouse_codes" placeholder="All atau WH-01, WH-02" /></label>
    </WmsActionForm></section>
    <div className="inventory-message warning">Akun harus dibuat lebih dulu di Supabase Auth. Menambah role di sini tidak menghapus role lain yang sudah aktif.</div>
    <section className="section"><DataTable columns={[
      { key: "name", header: "Nama", render: row => <strong>{row.full_name ?? "-"}</strong> },
      { key: "email", header: "Email", render: row => row.email ?? "-" },
      { key: "roles", header: "Role", render: row => row.roles.join(", ") || "-" },
      { key: "warehouse", header: "Default", render: row => row.default_warehouse ?? "All" },
      { key: "scope", header: "Scope", render: row => row.warehouse_scope.join(", ") || "-" },
      { key: "status", header: "Status", render: row => <StatusBadge value={row.is_active ? "active" : "inactive"} /> },
    ]} rows={rows} /></section>
  </div>;
}
