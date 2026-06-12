import { Shield, UserCog, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { userProfiles } from "@/lib/demo-data";

function RoleBadge({ role }: { role: string }) {
  const toneMap: Record<string, string> = {
    Admin: "violet",
    Operator: "blue",
    Checker: "green",
    Supervisor: "amber",
    Viewer: "violet",
  };
  const tone = toneMap[role] ?? "violet";
  return <span className={`status ${tone}`}>{role}</span>;
}

export default function UsersPage() {
  const total = userProfiles.length;
  const active = userProfiles.filter((u) => u.status === "active").length;
  const roles = ["Admin", "Operator", "Checker", "Supervisor", "Viewer"];

  return (
    <div className="page">
      <PageHeader
        actions={
          <>
            <button className="secondary-button" type="button">
              Export
            </button>
            <button className="primary-button" type="button">
              <UserCog size={16} /> Tambah User
            </button>
          </>
        }
        description="Kelola akses pengguna, role, dan cakupan gudang berbasis RBAC."
        eyebrow="User management"
        icon={Users}
        title="User & Role Management"
      />

      {/* Summary strip */}
      <section className="section">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Total User", value: total, color: "var(--navy)" },
            { label: "Aktif", value: active, color: "var(--green)" },
            { label: "Tidak Aktif", value: total - active, color: "#e53e3e" },
            ...roles.map((r) => ({
              label: r,
              value: userProfiles.filter((u) => u.role === r).length,
              color: "var(--navy-2)",
            })),
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 20px",
                minWidth: 110,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <DataTable
          columns={[
            { key: "id", header: "ID", render: (row) => <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)" }}>{row.id}</span> },
            { key: "name", header: "Nama", render: (row) => <strong>{row.name}</strong> },
            { key: "email", header: "Email", render: (row) => <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{row.email}</span> },
            { key: "role", header: "Role", render: (row) => <RoleBadge role={row.role} /> },
            { key: "warehouse", header: "Warehouse", render: (row) => row.warehouse },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
            { key: "lastLogin", header: "Last Login", render: (row) => <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{row.lastLogin}</span> },
            { key: "action", header: "", render: () => <button className="icon-button" type="button"><Shield size={14} /></button> },
          ]}
          rows={userProfiles}
        />
      </section>
    </div>
  );
}
