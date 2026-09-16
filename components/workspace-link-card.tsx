import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function WorkspaceLinkCard({
  href,
  icon: Icon,
  title,
  description,
  tone = "blue",
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "violet";
}) {
  return (
    <Link className={`workspace-link-card ${tone}`} href={href}>
      <span className="workspace-link-icon"><Icon aria-hidden size={18} /></span>
      <span className="workspace-link-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <ArrowRight aria-hidden className="workspace-link-arrow" size={17} />
    </Link>
  );
}
