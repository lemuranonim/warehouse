"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Keluar dari Warehouse WMS"
      className={compact ? "icon-button" : "secondary-button"}
      disabled={busy}
      onClick={signOut}
      type="button"
    >
      <LogOut aria-hidden size={14} /> {!compact && (busy ? "Keluar..." : "Keluar")}
    </button>
  );
}
