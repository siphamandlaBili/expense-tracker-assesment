import type { UseQueryResult } from "@tanstack/react-query";
import { useId, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { LuInbox, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

type PanelProps = {
  title: string;
  /** Control shown at the top right, e.g. a range selector or link. */
  action?: ReactNode;
  className?: string;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
};

/** White rounded card with a heading; every dashboard widget sits in one. */
export function Panel({
  title,
  action,
  className = "",
  ref,
  children,
}: PanelProps) {
  const headingId = useId();

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="font-semibold text-heading">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`}
    />
  );
}

export function EmptyState({ message }: { message: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
        <LuInbox className="size-6" aria-hidden />
      </span>
      <p className="font-medium text-heading">
        {t("dashboard.states.emptyTitle")}
      </p>
      <p className="max-w-xs text-sm text-body">{message}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <LuTriangleAlert className="size-6" aria-hidden />
      </span>
      <p className="font-medium text-heading">
        {t("dashboard.states.errorTitle")}
      </p>
      <p className="max-w-xs text-sm text-body">
        {t("dashboard.states.errorBody")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-light"
      >
        <LuRefreshCw className="size-4" aria-hidden />
        {t("dashboard.states.retry")}
      </button>
    </div>
  );
}

type QueryContentProps<T> = {
  query: UseQueryResult<T>;
  loading: ReactNode;
  /** Message for the empty state; only used when `isEmpty` returns true. */
  emptyMessage?: string;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

/** Renders the loading, error, empty or loaded state of a query. */
export function QueryContent<T>({
  query,
  loading,
  emptyMessage = "",
  isEmpty,
  children,
}: QueryContentProps<T>) {
  const { t } = useTranslation();

  if (query.isPending) {
    return (
      // A status region announces "Loading…" to screen readers; the
      // skeleton itself is decorative.
      <div role="status" aria-busy="true">
        <span className="sr-only">{t("dashboard.states.loading")}</span>
        {loading}
      </div>
    );
  }
  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data)) {
    return <EmptyState message={emptyMessage} />;
  }
  return <>{children(query.data)}</>;
}
