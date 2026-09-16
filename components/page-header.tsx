import type { LucideIcon } from "lucide-react";

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
      <div className="page-header-content">
        {Icon ? <span className="page-header-icon" aria-hidden><Icon size={19} /></span> : null}
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
        </div>
      </div>
      {actions ? (
        <div className="toolbar">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
