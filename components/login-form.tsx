"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, LoaderCircle, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="primary-button"
      disabled={pending}
      type="submit"
      style={{ width: "100%", height: 46, fontSize: "0.88rem" }}
    >
      {pending ? <LoaderCircle aria-hidden className="spin" size={16} /> : <LogIn aria-hidden size={16} />}
      {pending ? "Memverifikasi..." : "Masuk ke WMS"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction}>
      <div style={{ marginBottom: 16 }}>
        <label className="field-label" htmlFor="email">Email</label>
        <input
          autoComplete="username"
          autoFocus
          className="scan-input"
          id="email"
          maxLength={254}
          name="email"
          placeholder="user@advantaseeds.co.id"
          required
          style={{ width: "100%" }}
          type="email"
        />
      </div>

      <div style={{ marginBottom: state.error ? 14 : 28 }}>
        <label className="field-label" htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          className="scan-input"
          id="password"
          maxLength={128}
          minLength={8}
          name="password"
          placeholder="Masukkan password"
          required
          style={{ width: "100%" }}
          type="password"
        />
      </div>

      {state.error ? (
        <div className="inventory-message error" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle aria-hidden size={16} /> {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
