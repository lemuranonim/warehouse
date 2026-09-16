import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="login-layout">
      {/* Left panel — brand */}
      <div className="login-brand-panel" style={{
        background: "linear-gradient(160deg, #1a3272 0%, #22408c 60%, #1a3272 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: 320, height: 320, borderRadius: "50%",
          background: "rgba(26,186,106,0.08)",
          border: "1px solid rgba(26,186,106,0.12)"
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", left: "-60px",
          width: 260, height: 260, borderRadius: "50%",
          background: "rgba(26,186,106,0.06)",
          border: "1px solid rgba(26,186,106,0.10)"
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(26,186,106,0.05) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none"
        }} />

        {/* Logo */}
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{
            margin: "0 auto 24px",
            width: 140,
            height: 140,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.1)"
          }}>
            <Image
              src="/logo_wh.png"
              alt="WH Warehouse Logo"
              width={140}
              height={140}
              priority
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.04em",
            marginBottom: 8
          }}>
            Warehouse WMS
          </h1>
          <p style={{
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 36,
            lineHeight: 1.5
          }}>
            PT Advanta Seeds Indonesia
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            {[
              "📦 Inventory & LPN Management",
              "🚚 Inbound / Outbound Control",
              "📍 Putaway & Pick Tasks",
              "🔄 Cycle Count & Stock Adjustment",
              "📊 Real-time Dashboard"
            ].map((feat) => (
              <div key={feat} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 14px",
                background: "rgba(255,255,255,0.07)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.75)",
                width: "100%"
              }}>
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 3,
          background: "linear-gradient(90deg, #0d9668, #1aba6a, #0d9668)"
        }} />
      </div>

      {/* Right panel — form */}
      <div className="login-form-panel" style={{
        background: "#f2f5fb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 56px"
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Form header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(26,50,114,0.08)",
              border: "1px solid rgba(26,50,114,0.12)",
              marginBottom: 16,
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#1a3272",
              letterSpacing: "0.08em",
              textTransform: "uppercase"
            }}>
              <ShieldCheck size={11} />
              Secure Login
            </div>
            <h2 style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#1a3272",
              letterSpacing: "-0.04em",
              marginBottom: 6
            }}>
              Selamat datang kembali
            </h2>
            <p style={{ fontSize: "0.84rem", color: "#7a8fae" }}>
              Masuk untuk mengakses sistem manajemen gudang.
            </p>
          </div>

          <LoginForm />

          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: "1px solid #dde3f0",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 7
          }}>
            <ShieldCheck size={12} style={{ color: "#b3c0d4" }} />
            <span style={{ fontSize: "0.7rem", color: "#b3c0d4" }}>
              Dilindungi dengan role-based access control
            </span>
          </div>

          {/* Advanta branding */}
          <div style={{
            marginTop: 40, paddingTop: 24,
            borderTop: "1px solid #dde3f0",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10
          }}>
            <Image
              src="/logo_wh_notitle_unbox.png"
              alt="WH"
              width={32}
              height={22}
              style={{ objectFit: "contain", opacity: 0.4 }}
            />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#b3c0d4" }}>
                WMS v1.0.0 · Production Candidate
              </p>
              <p style={{ fontSize: "0.62rem", color: "#b3c0d4" }}>
                PT Advanta Seeds Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
