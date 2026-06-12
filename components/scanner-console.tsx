"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  ScanLine,
  Send,
  Terminal
} from "lucide-react";
import { scanLinks, scanScenarios } from "@/lib/demo-data";
import { StatusBadge } from "@/components/status-badge";

const modes = ["Inventory Lookup", "Putaway", "Picking", "Dispatch", "Cycle Count"] as const;

export function ScannerConsole() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Inventory Lookup");
  const [rawValue, setRawValue] = useState("https://wms.domainmu.com/s/A7K9Q2");
  const [history, setHistory] = useState<string[]>([
    "Ready. Scan LPN, lokasi, item, atau barcode dokumen."
  ]);

  const resolved = useMemo(() => {
    const token = parseToken(rawValue);
    return scanLinks.find((link) => link.token.toLowerCase() === token.toLowerCase());
  }, [rawValue]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = parseToken(rawValue);
    const link = scanLinks.find((item) => item.token.toLowerCase() === token.toLowerCase());
    if (!link) {
      setHistory((items) => [`[FAIL] ${mode} › ${token || "-"} — tidak ditemukan`, ...items]);
      return;
    }
    setHistory((items) => [
      `[OK]   ${mode} › ${link.entityType}:${link.entityCode} — diterima`,
      ...items
    ]);
  }

  return (
    <section className="scanner-panel">
      {/* Left: scan input */}
      <div className="card" style={{ padding: 24 }}>
        <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Scan Workstation</p>
            <h2 style={{ marginBottom: 0 }}>LPN / Lokasi / Dokumen Scanner</h2>
          </div>
          <div style={{
            width: 44, height: 44,
            display: "grid", placeItems: "center",
            borderRadius: 10,
            background: "var(--navy-light)",
            color: "var(--navy)",
            border: "1px solid var(--navy-mid)"
          }}>
            <ScanLine size={20} />
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap",
          padding: "5px",
          background: "var(--surface-2)",
          borderRadius: 10,
          border: "1px solid var(--line)",
          marginBottom: 20
        }}>
          {modes.map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              type="button"
              style={{
                padding: "6px 13px",
                borderRadius: 7,
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: mode === item ? "var(--navy)" : "transparent",
                color: mode === item ? "#fff" : "var(--muted)",
                boxShadow: mode === item ? "var(--shadow-navy)" : "none"
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          <label style={{
            display: "block", fontSize: "0.67rem", fontWeight: 700,
            color: "var(--muted)", letterSpacing: "0.07em",
            textTransform: "uppercase", marginBottom: 8
          }} htmlFor="scan-input">
            Barcode atau Nilai QR
          </label>
          <div className="toolbar" style={{ marginBottom: 20 }}>
            <input
              className="scan-input"
              id="scan-input"
              onChange={(e) => setRawValue(e.target.value)}
              value={rawValue}
              placeholder="Scan atau ketik barcode / QR code..."
            />
            <button className="primary-button" type="submit" style={{ flexShrink: 0 }}>
              <Send size={14} /> Submit
            </button>
            <button
              className="icon-button"
              onClick={() => setRawValue("https://wms.domainmu.com/s/A7K9Q2")}
              title="Reset"
              type="button"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </form>

        {/* Result */}
        <div>
          <p style={{
            fontSize: "0.67rem", fontWeight: 700, color: "var(--muted)",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10
          }}>
            Hasil Scan
          </p>
          {resolved ? (
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "var(--green-light)",
              border: "1px solid var(--green-mid)"
            }}>
              <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={15} style={{ color: "var(--green)", flexShrink: 0 }} />
                  <strong style={{ color: "var(--navy)", fontSize: "0.88rem" }}>{resolved.entityCode}</strong>
                </div>
                <StatusBadge value={resolved.status} />
              </div>
              <p className="muted small" style={{ marginBottom: 3 }}>{resolved.title}</p>
              <p className="small" style={{ color: "var(--ink-2)" }}>{resolved.subtitle}</p>
            </div>
          ) : (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "var(--rose-light)",
              border: "1px solid #fecdd3",
              color: "var(--rose)", fontSize: "0.82rem", fontWeight: 600
            }}>
              Data scan tidak ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* Right: log panel */}
      <aside className="card" style={{ padding: 20 }}>
        <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "var(--navy)",
              display: "grid", placeItems: "center"
            }}>
              <Terminal size={13} style={{ color: "var(--green-2)" }} />
            </div>
            <h2 style={{ marginBottom: 0, fontSize: "0.9rem" }}>Log Scanner</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--green-2)",
              boxShadow: "0 0 0 2px var(--green-light)"
            }} />
            <span style={{ fontSize: "0.68rem", color: "var(--green)", fontWeight: 700 }}>LIVE</span>
          </div>
        </div>

        <pre className="scan-output">{history.join("\n")}</pre>

        <div style={{ marginTop: 16 }}>
          <p style={{
            fontSize: "0.67rem", fontWeight: 700, color: "var(--muted)",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10
          }}>
            Pengecekan Aktif
          </p>
          {scanScenarios
            .filter((s) => s.mode === mode || s.scenario === mode)
            .slice(0, 1)
            .map((scenario) => (
              <div
                key={scenario.scenario}
                style={{
                  padding: "10px 13px", borderRadius: 8,
                  background: "var(--navy-light)",
                  border: "1px solid var(--navy-mid)"
                }}
              >
                <p style={{
                  fontSize: "0.8rem", color: "var(--ink-2)",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 4
                }}>
                  <CheckCircle2 size={13} style={{ color: "var(--navy)", flexShrink: 0 }} />
                  {scenario.validation}
                </p>
                <p className="muted small">{scenario.result}</p>
              </div>
            ))}
        </div>
      </aside>
    </section>
  );
}

function parseToken(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";
  const parts = trimmed.split("/");
  return parts[parts.length - 1] || trimmed;
}
