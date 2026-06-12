import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
  trend?: string;
  trendUp?: boolean;
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  trend,
  trendUp = true
}: MetricCardProps) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-card-header">
        <span className={`metric-label ${tone}`}>{label}</span>
        <div className={`metric-icon ${tone}`}>
          <Icon aria-hidden size={16} />
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="metric-helper">{helper}</p>
        {trend && (
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: trendUp ? "var(--emerald)" : "var(--rose)",
            background: trendUp ? "var(--emerald-light)" : "var(--rose-light)",
            padding: "2px 7px",
            borderRadius: 5,
            letterSpacing: "0.02em"
          }}>
            {trend}
          </span>
        )}
      </div>
    </article>
  );
}
