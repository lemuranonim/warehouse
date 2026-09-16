"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { realtimeTablesForPath } from "@/lib/realtime-routes";

export function RealtimeRefresh() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_WMS_DATA_MODE !== "live") return;
    const realtimeTables = realtimeTablesForPath(pathname);
    if (!realtimeTables.length) return;

    const supabase = createBrowserSupabaseClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const channelKey = pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "dashboard";
    const channel = supabase.channel(`wms-production-${channelKey}`);
    for (const table of realtimeTables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          startTransition(() => router.refresh());
        }, 350);
      });
    }
    channel.subscribe();
    return () => {
      clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [pathname, router]);

  return null;
}
