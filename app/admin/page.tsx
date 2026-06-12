import { ClipboardList, Database, ShieldCheck, Activity, BarChart3, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { modules, rolesAccess, rpcEndpoints } from "@/lib/demo-data";

export default function AdminPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Control Tower"
        title="Warehouse Operations Control Tower"
        description="Manage master data, inbound orders, outbound orders, LPN labels, task controls, and inventory transaction visibility."
      />

      {/* KPI Cards */}
      <section className="grid grid-3">
        <MetricCard
          helper="Enabled WMS operational areas"
          icon={ClipboardList}
          label="Modules"
          tone="blue"
          value="10"
        />
        <MetricCard
          helper="Warehouse task business checks"
          icon={Database}
          label="Controls"
          tone="green"
          value="8"
        />
        <MetricCard
          helper="Permission matrix (RACI)"
          icon={ShieldCheck}
          label="Roles"
          tone="violet"
          value="RACI"
        />
      </section>

      {/* System Status */}
      <div style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12
      }}>
        {[
          { label: "API Health", value: "99.98%", color: "var(--emerald)", bg: "var(--emerald-light)", border: "#bbf7d0", icon: Activity },
          { label: "Active Users", value: "12", color: "var(--brand)", bg: "var(--brand-light)", border: "var(--brand-mid)", icon: Users },
          { label: "Daily Tasks", value: "247", color: "var(--amber)", bg: "var(--amber-light)", border: "#fde68a", icon: BarChart3 },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "13px 18px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-xs)"
          }}>
            <div style={{
              width: 36, height: 36,
              display: "grid", placeItems: "center",
              borderRadius: 9,
              background: bg,
              color,
              border: `1px solid ${border}`
            }}>
              <Icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em" }}>
                {value}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modules Table */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">WMS Modules</h2>
            <p className="section-subtitle">Operational areas for inventory control, receiving, putaway, picking, dispatch, and stock count.</p>
          </div>
        </div>
        <DataTable
          columns={[
            {
              key: "module", header: "Module",
              render: (row) => <span style={{ fontWeight: 600, color: "var(--ink)" }}>{row.module}</span>
            },
            {
              key: "route", header: "Workspace",
              render: (row) => (
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.76rem", color: "var(--brand)", fontWeight: 600 }}>
                  {row.route}
                </span>
              )
            },
            { key: "features", header: "Capability", render: (row) => row.features },
            { key: "backend", header: "Process", render: (row) => row.backend },
            { key: "priority", header: "Priority", render: (row) => <StatusBadge value={row.priority} /> }
          ]}
          rows={modules}
        />
      </section>

      {/* Role + Controls */}
      <section className="section grid grid-2">
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Role Access</h2>
              <p className="section-subtitle">Permission matrix by warehouse area and role.</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "process", header: "Warehouse Area",
                render: (row) => <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{row.process}</span>
              },
              { key: "role", header: "Role", render: (row) => row.primaryRole },
              {
                key: "raci", header: "RACI",
                render: (row) => (
                  <span style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.76rem", fontWeight: 700, color: "var(--violet)"
                  }}>
                    {row.raci}
                  </span>
                )
              },
              { key: "access", header: "Access", render: (row) => row.access }
            ]}
            rows={rolesAccess}
          />
        </div>
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Task Controls</h2>
              <p className="section-subtitle">Business rule checks for every warehouse operation.</p>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: "name", header: "Control",
                render: (row) => <span style={{ fontWeight: 600, color: "var(--ink)" }}>{row.name}</span>
              },
              { key: "caller", header: "Owner", render: (row) => row.caller },
              { key: "validation", header: "Check", render: (row) => row.validation },
              { key: "priority", header: "Priority", render: (row) => <StatusBadge value={row.priority} /> }
            ]}
            rows={rpcEndpoints}
          />
        </div>
      </section>
    </div>
  );
}
