import Link from "next/link";
import { ShieldX } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export default function AccessDeniedPage() {
  return (
    <div className="auth-message-page">
      <section className="card auth-message-card">
        <ShieldX aria-hidden size={44} style={{ color: "#c53030" }} />
        <p className="eyebrow">Akses dibatasi</p>
        <h1>Role Anda tidak memiliki izin</h1>
        <p className="muted">
          Hubungi administrator Warehouse WMS jika penugasan role atau cakupan gudang perlu diperbarui.
        </p>
        <div className="toolbar" style={{ justifyContent: "center" }}>
          <Link className="primary-button" href="/">Kembali ke dashboard</Link>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
