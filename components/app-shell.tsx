"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileCheck,
  Gauge,
  History,
  Home,
  MapPinned,
  PackageCheck,
  PackagePlus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import {
  ADMIN_ROLES,
  CHECKER_ROLES,
  OPERATOR_ROLES,
  SUPERVISOR_ROLES,
  type WmsRole,
} from "@/lib/access-control";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/sign-out-button";
import { RealtimeRefresh } from "@/components/realtime-refresh";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  roles?: readonly WmsRole[];
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Ringkasan",
    items: [
      { href: "/", label: "Ringkasan Inventori", icon: Home },
      { href: "/admin", label: "Panel Admin", icon: Gauge, roles: ADMIN_ROLES },
      { href: "/operator/scan", label: "Scan Barcode", icon: ScanLine },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/materials", label: "Master Material", icon: Boxes, roles: ADMIN_ROLES },
      { href: "/admin/stock-types", label: "Tipe Stok", icon: Database, roles: ADMIN_ROLES },
      { href: "/admin/inventory", label: "Database Inventori", icon: Database, roles: SUPERVISOR_ROLES },
      { href: "/admin/locations", label: "Master Lokasi", icon: MapPinned, roles: ADMIN_ROLES },
      { href: "/admin/inbound", label: "Order Inbound", icon: PackagePlus, roles: ADMIN_ROLES },
      { href: "/admin/labels", label: "Cetak Label LPN", icon: QrCode, roles: ADMIN_ROLES },
      { href: "/admin/outbound", label: "Order Outbound", icon: Truck, roles: SUPERVISOR_ROLES },
      { href: "/admin/audit", label: "Transaksi & Audit", icon: History, roles: SUPERVISOR_ROLES },
      { href: "/admin/users", label: "Pengguna & Role", icon: UserRound, roles: ADMIN_ROLES },
    ],
  },
  {
    title: "Operasional",
    items: [
      { href: "/checker/receiving", label: "Penerimaan Barang", icon: ClipboardCheck, roles: CHECKER_ROLES },
      { href: "/operator/putaway", label: "Putaway", icon: PackageCheck, roles: OPERATOR_ROLES },
      { href: "/operator/picking", label: "Tugas Picking", icon: ClipboardList, roles: OPERATOR_ROLES },
      { href: "/operator/staging", label: "Staging", icon: MapPinned, roles: OPERATOR_ROLES },
      { href: "/checker/shipping", label: "Pengiriman", icon: FileCheck, roles: CHECKER_ROLES },
      { href: "/operator/cycle-count", label: "Cycle Counts", icon: Database, roles: OPERATOR_ROLES },
      { href: "/supervisor/adjustments", label: "Penyesuaian Stok", icon: ShieldCheck, roles: SUPERVISOR_ROLES },
    ],
  },
];

const isLiveDataMode = process.env.NEXT_PUBLIC_WMS_DATA_MODE === "live";

function canShow(userRoles: readonly string[], requiredRoles?: readonly WmsRole[]) {
  return !requiredRoles || requiredRoles.some((role) => userRoles.includes(role));
}

function NavLinkContent({ icon: Icon, label }: { icon: typeof Home; label: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <Icon aria-hidden size={15} />
      <span>{label}</span>
      <span aria-hidden className={`nav-pending-indicator${pending ? " pending" : ""}`} />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/access-denied";
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const identityLoadedForApp = useRef(false);

  useEffect(() => {
    if (isAuthRoute) {
      identityLoadedForApp.current = false;
      return;
    }

    if (identityLoadedForApp.current) return;
    identityLoadedForApp.current = true;
    let active = true;
    async function loadIdentity() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.rpc("wms_current_access");
      const access = data?.[0];
      if (!active) return;
      if (access) {
        setEmail(access.email ?? "");
        setRoles(access.roles);
      }
      setIdentityLoaded(true);
    }
    void loadIdentity();
    return () => { active = false; };
  }, [isAuthRoute]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      identityLoadedForApp.current = false;
      setEmail("");
      setRoles([]);
      setIdentityLoaded(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const visibleGroups = useMemo(() => identityLoaded ? navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canShow(roles, item.roles)) }))
    .filter((group) => group.items.length > 0) : [], [identityLoaded, roles]);

  if (isAuthRoute) {
    return <main className="auth-shell-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Image src="/logo_wh_notitle_unbox.png" alt="WH Logo" width={38} height={38} />
          </span>
          <span className="brand-copy">
            <strong>Warehouse WMS</strong>
            <span>PT Advanta Seeds Indonesia</span>
          </span>
        </Link>

        <div className="sidebar-live" style={{ padding: "0 12px", marginBottom: 4 }}>
          <div className="secure-session-badge">
            <ShieldCheck aria-hidden size={12} />
            <span>SECURE SESSION</span>
          </div>
        </div>

        <div className="nav-scroll">
          {!identityLoaded ? <div className="nav-loading" role="status">Memuat menu akses...</div> : null}
          {visibleGroups.map((group) => (
            <nav className="nav-section" key={group.title}>
              <div className="nav-section-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link className={`nav-link${isActive ? " active" : ""}`} href={item.href} key={item.href}>
                    <NavLinkContent icon={Icon} label={item.label} />
                  </Link>
                );
              })}
            </nav>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <UserRound aria-hidden size={16} />
            <div>
              <strong>{email || "WMS User"}</strong>
              <span>{roles.join(" · ") || "Memuat role..."}</span>
            </div>
            <SignOutButton compact />
          </div>
          <div className="sidebar-version">WMS v1.0 · Production</div>
        </div>
      </aside>
      <main className="main">
        <RealtimeRefresh />
        <div className={`environment-banner ${isLiveDataMode ? "pilot" : "demo"}`} role="status">
          <strong>{isLiveDataMode ? "PRODUCTION LIVE" : "DEMO READ-ONLY"}</strong>
          <span>
            {isLiveDataMode
              ? "Database aktif · Data diperbarui otomatis secara real-time."
              : "Data layar adalah contoh. Scanner dan posting transaksi tidak mengubah database."}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
