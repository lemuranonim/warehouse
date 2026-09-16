"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, RotateCcw, ScanLine, Send, Terminal } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { parseScanToken } from "@/lib/scan-token";
import type { Json } from "@/lib/supabase/types";

const modes = ["Inventory Lookup", "Putaway", "Picking", "Dispatch", "Cycle Count"] as const;
const IS_LIVE_MODE = process.env.NEXT_PUBLIC_WMS_DATA_MODE === "live";
type ScanMode = (typeof modes)[number];

type ScanResult = {
  result: "success" | "failed";
  message?: string;
  token?: string;
  entity_type?: string;
  entity_id?: string;
  display_payload?: Record<string, Json | undefined>;
};

const guidance: Record<ScanMode, { validation: string; result: string }> = {
  "Inventory Lookup": {
    validation: "Token aktif, role WMS, dan cakupan warehouse",
    result: "Lookup terhubung ke RPC dan audit scan event.",
  },
  Putaway: {
    validation: "Scan LPN diterima, lalu scan lokasi storage",
    result: "Konfirmasi dijalankan atomik dengan idempotency key.",
  },
  Picking: {
    validation: "Validasi token LPN; konfirmasi task dilakukan pada antrean Picking",
    result: "Token dicocokkan ke database dan scan dicatat untuk audit.",
  },
  Dispatch: {
    validation: "Validasi token DN/LPN; dispatch final dilakukan oleh Checker",
    result: "Token dicocokkan ke database dan scan dicatat untuk audit.",
  },
  "Cycle Count": {
    validation: "Validasi token; input aktual dilakukan pada sesi Cycle Count",
    result: "Token dicocokkan ke database dan scan dicatat untuk audit.",
  },
};

function friendlyError(message?: string) {
  if (!message) return "Scan gagal diproses.";
  if (/demo mode/i.test(message)) return "Scanner database dinonaktifkan pada mode demo. Aktifkan mode live setelah migrasi produksi diterapkan.";
  if (/warehouse access denied/i.test(message)) return "Token berada di luar cakupan warehouse Anda.";
  if (/role required|authentication required|permission denied/i.test(message)) return "Role Anda tidak memiliki izin untuk tindakan ini.";
  if (/not found|inactive/i.test(message)) return "Token tidak ditemukan atau sudah tidak aktif.";
  if (/capacity exceeded/i.test(message)) return "Kapasitas lokasi tujuan tidak mencukupi.";
  return "Scan gagal diproses. Hubungi administrator jika masalah berulang.";
}

function displayValue(payload: ScanResult["display_payload"], key: string) {
  const value = payload?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function ScannerConsole() {
  const [mode, setMode] = useState<ScanMode>("Inventory Lookup");
  const [rawValue, setRawValue] = useState("");
  const [resolved, setResolved] = useState<ScanResult | null>(null);
  const [putawayLpnToken, setPutawayLpnToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Ready. Scan LPN, lokasi, item, atau barcode dokumen.",
  ]);

  async function resolveToken(input: string) {
    const supabase = createBrowserSupabaseClient();
    const { data, error: rpcError } = await supabase.rpc("wms_resolve_scan_token", {
      raw_value: input,
      workflow: mode,
      device_info: {
        platform: navigator.platform.slice(0, 80),
        userAgent: navigator.userAgent.slice(0, 240),
      },
    });
    if (rpcError) throw rpcError;
    return data as unknown as ScanResult;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = parseScanToken(rawValue);
    if (!token) {
      setError("Scan atau masukkan token terlebih dahulu.");
      return;
    }
    if (!IS_LIVE_MODE) {
      const message = friendlyError("DEMO MODE");
      setError(message);
      setHistory((items) => [`[READ-ONLY] ${message}`, ...items]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await resolveToken(rawValue);
      if (result.result !== "success") throw new Error(result.message ?? "Token not found");
      setResolved(result);

      if (mode === "Putaway") {
        if (!putawayLpnToken) {
          if (result.entity_type !== "lpn") throw new Error("Scan LPN terlebih dahulu");
          setPutawayLpnToken(token);
          setHistory((items) => [`[STEP 1/2] LPN ${token} diterima — scan lokasi tujuan`, ...items]);
          setRawValue("");
          return;
        }

        if (result.entity_type !== "location") throw new Error("Scan lokasi storage sebagai langkah kedua");
        const supabase = createBrowserSupabaseClient();
        const { data: movementId, error: putawayError } = await supabase.rpc("wms_putaway_lpn", {
          lpn_token: putawayLpnToken,
          location_token: token,
          idempotency_key: crypto.randomUUID(),
        });
        if (putawayError) throw putawayError;
        setHistory((items) => [`[OK] Putaway ${putawayLpnToken} → ${token} · movement ${movementId}`, ...items]);
        setPutawayLpnToken("");
        setRawValue("");
        return;
      }

      const entityCode = displayValue(result.display_payload, "lpn_code")
        || displayValue(result.display_payload, "location_code")
        || result.token
        || token;
      const prefix = mode === "Inventory Lookup" ? "OK" : "CHECK";
      setHistory((items) => [`[${prefix}] ${mode} › ${result.entity_type}:${entityCode}`, ...items]);
      setRawValue("");
    } catch (reason) {
      const message = friendlyError(reason instanceof Error ? reason.message : undefined);
      setError(message);
      setHistory((items) => [`[FAIL] ${mode} › ${token} — ${message}`, ...items]);
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: ScanMode) {
    setMode(nextMode);
    setResolved(null);
    setPutawayLpnToken("");
    setError("");
    setRawValue("");
  }

  function reset() {
    setRawValue("");
    setResolved(null);
    setPutawayLpnToken("");
    setError("");
  }

  const payload = resolved?.display_payload;
  const entityCode = displayValue(payload, "lpn_code")
    || displayValue(payload, "location_code")
    || resolved?.token
    || "Token valid";
  const status = displayValue(payload, "status") || (resolved?.result === "success" ? "verified" : "unknown");
  const description = displayValue(payload, "description") || displayValue(payload, "warehouse") || resolved?.entity_type || "";
  const subtitle = [
    displayValue(payload, "material_code"),
    displayValue(payload, "lot_number"),
    displayValue(payload, "location_code"),
  ].filter(Boolean).join(" · ");

  return (
    <section className="scanner-panel">
      <div className="card" style={{ padding: 24 }}>
        <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Scan Workstation</p>
            <h2 style={{ marginBottom: 0 }}>LPN / Lokasi / Dokumen Scanner</h2>
          </div>
          <div className="scanner-icon"><ScanLine aria-hidden size={20} /></div>
        </div>

        <div className="scanner-mode-tabs">
          {modes.map((item) => (
            <button
              aria-pressed={mode === item}
              className={mode === item ? "active" : ""}
              key={item}
              onClick={() => changeMode(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        {mode === "Putaway" && putawayLpnToken ? (
          <div className="inventory-message success">
            <CheckCircle2 aria-hidden size={16} /> LPN {putawayLpnToken} siap. Scan lokasi storage tujuan.
          </div>
        ) : null}

        <form onSubmit={submit}>
          <label className="field-label" htmlFor="scan-input">Barcode atau Nilai QR</label>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <input
              autoComplete="off"
              autoFocus
              className="scan-input"
              disabled={loading}
              id="scan-input"
              maxLength={512}
              onChange={(event) => setRawValue(event.target.value)}
              placeholder={mode === "Putaway" && putawayLpnToken ? "Scan lokasi tujuan..." : "Scan atau ketik barcode / QR code..."}
              value={rawValue}
            />
            <button className="primary-button" disabled={loading} type="submit" style={{ flexShrink: 0 }}>
              {loading ? <LoaderCircle aria-hidden className="spin" size={14} /> : <Send aria-hidden size={14} />}
              {loading ? "Memeriksa..." : "Submit"}
            </button>
            <button className="icon-button" onClick={reset} title="Reset" type="button">
              <RotateCcw aria-hidden size={14} />
            </button>
          </div>
        </form>

        {error ? <div className="inventory-message error" role="alert">{error}</div> : null}

        <div>
          <p className="field-label">Hasil Scan</p>
          {resolved?.result === "success" ? (
            <div className="scan-result-success">
              <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 aria-hidden size={15} style={{ color: "var(--green)" }} />
                  <strong>{entityCode}</strong>
                </div>
                <StatusBadge value={status} />
              </div>
              <p className="muted small">{description}</p>
              {subtitle ? <p className="small">{subtitle}</p> : null}
            </div>
          ) : (
            <div className="scan-result-empty">Belum ada hasil scan terverifikasi.</div>
          )}
        </div>
      </div>

      <aside className="card" style={{ padding: 20 }}>
        <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="terminal-icon"><Terminal aria-hidden size={13} /></div>
            <h2 style={{ marginBottom: 0, fontSize: "0.9rem" }}>Log Scanner</h2>
          </div>
          <span className="status green">AUDITED</span>
        </div>

        <pre className="scan-output">{history.join("\n")}</pre>

        <div style={{ marginTop: 16 }}>
          <p className="field-label">Pengecekan Aktif</p>
          <div className="scanner-guidance">
            <p><CheckCircle2 aria-hidden size={13} /> {guidance[mode].validation}</p>
            <p className="muted small">{guidance[mode].result}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
