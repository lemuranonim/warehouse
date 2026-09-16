"use client";

import { useActionState } from "react";

export type WmsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialWmsActionState: WmsActionState = { status: "idle", message: "" };

export type WmsAction = (state: WmsActionState, formData: FormData) => Promise<WmsActionState>;

export function WmsActionForm({
  action,
  children,
  submitLabel,
  className = "wms-form",
}: {
  action: WmsAction;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialWmsActionState);

  return (
    <form action={formAction} className={className}>
      {children}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Memproses..." : submitLabel}
      </button>
      {state.message ? (
        <span className={`action-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
