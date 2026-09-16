"use client";

import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("WMS global error", error); }, [error]);
  return <html lang="id"><body style={{ margin: 0, background: "#f2f5fb", color: "#1a3272", fontFamily: "Arial, sans-serif" }}>
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 520, padding: 28, background: "white", border: "1px solid #dde3f0", borderRadius: 14 }} role="alert">
        <h1 style={{ marginTop: 0 }}>Warehouse WMS sementara tidak tersedia</h1>
        <p style={{ color: "#61708a", lineHeight: 1.6 }}>Silakan coba kembali. Transaksi yang belum mendapat konfirmasi berhasil tidak dianggap terposting.</p>
        {error.digest ? <p style={{ color: "#8794aa", fontSize: 12 }}>Reference: {error.digest}</p> : null}
        <button onClick={() => retry()} style={{ border: 0, borderRadius: 8, background: "#1a3272", color: "white", padding: "10px 18px", fontWeight: 700 }} type="button">Coba Lagi</button>
      </section>
    </main>
  </body></html>;
}
