import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
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
  Zap
} from "lucide-react";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "WMS — PT Advanta Seeds Indonesia",
  description: "Warehouse Management System — Inventory control, inbound receiving, putaway, picking, dispatch, cycle count, dan LPN scanning untuk PT Advanta Seeds Indonesia.",
};

export const viewport: Viewport = {
  themeColor: "#1a3272"
};

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Inventory Overview", icon: Home },
      { href: "/admin", label: "Control Tower", icon: Gauge },
      { href: "/operator/scan", label: "Scan Workstation", icon: ScanLine }
    ]
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/materials", label: "Item Master", icon: Boxes },
      { href: "/admin/inventory", label: "Inventory Database", icon: Database },
      { href: "/admin/locations", label: "Location Master", icon: MapPinned },
      { href: "/admin/inbound", label: "Inbound Orders", icon: PackagePlus },
      { href: "/admin/labels", label: "Label Printing", icon: QrCode },
      { href: "/admin/outbound", label: "Outbound Orders", icon: Truck },
      { href: "/admin/audit", label: "Inventory Transactions", icon: History }
    ]
  },
  {
    title: "Operations",
    items: [
      { href: "/checker/receiving", label: "Goods Receiving", icon: ClipboardCheck },
      { href: "/operator/putaway", label: "Putaway", icon: PackageCheck },
      { href: "/operator/picking", label: "Pick Tasks", icon: ClipboardList },
      { href: "/checker/shipping", label: "Dispatch", icon: FileCheck },
      { href: "/operator/cycle-count", label: "Cycle Counts", icon: Database },
      { href: "/supervisor/adjustments", label: "Stock Adjustments", icon: ShieldCheck }
    ]
  }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <div className="app-shell">
          <aside className="sidebar" aria-label="Primary navigation">

            {/* Brand header */}
            <Link className="brand" href="/">
              <span className="brand-mark">
                <Image
                  src="/logo_wh_notitle_unbox.png"
                  alt="WH Logo"
                  width={38}
                  height={38}
                  style={{ objectFit: "contain", width: "100%", height: "100%" }}
                />
              </span>
              <span className="brand-copy">
                <strong>Warehouse WMS</strong>
                <span>PT Advanta Seeds Indonesia</span>
              </span>
            </Link>

            {/* System live badge */}
            <div className="sidebar-live" style={{ padding: "0 12px", marginBottom: 4 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 10px",
                background: "rgba(26,186,106,0.12)",
                borderRadius: 8,
                border: "1px solid rgba(26,186,106,0.2)"
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#1aba6a",
                  boxShadow: "0 0 0 2px rgba(26,186,106,0.25)",
                  display: "block",
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: "0.68rem", color: "#1aba6a",
                  fontWeight: 700, letterSpacing: "0.06em"
                }}>
                  SYSTEM LIVE
                </span>
                <Zap size={10} style={{ color: "#1aba6a", marginLeft: "auto" }} />
              </div>
            </div>

            {/* Navigation */}
            <div className="nav-scroll">
              {navGroups.map((group) => (
                <nav className="nav-section" key={group.title}>
                  <div className="nav-section-title">{group.title}</div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link className="nav-link" href={item.href} key={item.href}>
                        <Icon aria-hidden size={15} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ))}
            </div>

            {/* Sidebar footer */}
            <div className="sidebar-footer" style={{
              marginTop: "auto",
              padding: "16px 12px 0",
              borderTop: "1px solid rgba(255,255,255,0.08)"
            }}>
              {/* Divider info */}
              <div style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(13,150,104,0.12)",
                border: "1px solid rgba(26,186,106,0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Image
                    src="/logo_wh_notitle_unbox.png"
                    alt="WH"
                    width={20}
                    height={20}
                    style={{ objectFit: "contain", opacity: 0.85, filter: "brightness(0) invert(1)" }}
                  />
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1aba6a" }}>
                    WMS v2.5.0
                  </span>
                </div>
                <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
                  PT Advanta Seeds Indonesia<br />Warehouse Management System
                </p>
              </div>
            </div>

          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
