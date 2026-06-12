import { WorkflowStep } from "@/lib/demo-data";
import { StatusBadge } from "@/components/status-badge";

export function WorkflowBoard({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="workflow-track" aria-label="Warehouse workflow steps">
      {steps.map((step) => (
        <article
          className="workflow-step"
          key={`${step.workflow}-${step.step}`}
        >
          <div
            className="toolbar"
            style={{ justifyContent: "space-between", marginBottom: 14 }}
          >
            <span className="step-index">{step.step}</span>
            <StatusBadge value={step.statusAfter} />
          </div>
          <h3 style={{ fontSize: "0.85rem", marginBottom: 6 }}>{step.workflow}</h3>
          <p className="small" style={{ marginBottom: 4, color: "var(--ink-2)" }}>
            <strong>{step.activity}</strong>
          </p>
          <p className="muted small" style={{ marginBottom: 2 }}>{step.actor}</p>
          <p className="muted small">{step.output}</p>
        </article>
      ))}
    </div>
  );
}
