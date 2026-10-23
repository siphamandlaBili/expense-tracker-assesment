import type { ReactNode } from "react";

export type Detail = { label: string; value: ReactNode };

/** Label/value rows separated by hairlines (summary cards, profile). */
export function DetailList({
  items,
  className = "",
}: {
  items: Detail[];
  className?: string;
}) {
  return (
    <dl className={`divide-y divide-slate-100 text-sm ${className}`}>
      {items.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-4 py-2.5">
          <dt className="text-body">{label}</dt>
          <dd className="text-right font-medium break-all text-heading">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
