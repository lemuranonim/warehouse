import { formatStatusLabel, statusTone } from "@/lib/format";

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${statusTone(value)}`}>{formatStatusLabel(value)}</span>;
}
