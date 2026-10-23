import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shown to the right of the title on wide screens, below it on narrow. */
  aside?: ReactNode;
};

/** The heading block every dashboard page starts with. */
export function PageHeader({ title, subtitle, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-body">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}
