import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
};

export function PageHeader({ eyebrow, title, description, actions, icon: Icon }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
      </div>
      {actions ? (
        <div className="toolbar">
          {Icon ? (
            <span className="icon-button" aria-hidden>
              <Icon size={16} />
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
