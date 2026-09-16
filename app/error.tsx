"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error("WMS route error", error); }, [error]);
  return <div className="page"><section className="card" role="alert">
    <p className="eyebrow">System recovery</p>
    <h1>Data belum dapat ditampilkan</h1>
    <p className="muted">Koneksi atau layanan database mungkin sedang tidak tersedia. Tidak ada transaksi yang diposting oleh halaman ini.</p>
    {error.digest ? <p className="small muted">Reference: {error.digest}</p> : null}
    <button className="primary-button" onClick={() => retry()} type="button">Coba Lagi</button>
  </section></div>;
}
