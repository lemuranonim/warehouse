"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const realtimeTables = [
  "wms_materials", "wms_warehouses", "wms_locations", "wms_lpns",
  "wms_stock_movements", "wms_inbound_documents", "wms_inbound_items",
  "wms_outbound_documents", "wms_outbound_items", "wms_picking_tasks",
  "wms_delivery_notes", "wms_cycle_count_sessions", "wms_cycle_count_lines",
  "wms_adjustment_requests", "wms_inventory_import_batches", "wms_scan_events",
] as const;

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_WMS_DATA_MODE !== "live") return;
    const supabase = createBrowserSupabaseClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel("wms-production-updates");
    for (const table of realtimeTables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => router.refresh(), 250);
      });
    }
    channel.subscribe();
    return () => {
      clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
