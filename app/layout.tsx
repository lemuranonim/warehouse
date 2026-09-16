import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "WMS — PT Advanta Seeds Indonesia",
  description: "Warehouse Management System untuk inventory, inbound, putaway, picking, dispatch, cycle count, dan LPN scanning.",
};

export const viewport: Viewport = {
  themeColor: "#1a3272",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
