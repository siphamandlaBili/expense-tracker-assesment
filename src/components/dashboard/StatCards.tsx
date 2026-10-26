import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowLeftRight,
  LuCoins,
  LuTrendingUp,
  LuWallet,
} from "react-icons/lu";
import type { SpendingSummary } from "../../api/schemas";
import { formatChange, formatCount, formatCurrency } from "../../lib/format";
import { ChangeIndicator } from "./ChangeIndicator";
import { ErrorState, Skeleton } from "./Panel";

// Each card's colour (App.css tokens): the icon block and a darker shade
// for the title, readable on white.
const TONES = {
  sky: { block: "bg-accent-sky", title: "text-accent-sky-text" },
  navy: { block: "bg-accent-navy", title: "text-accent-navy" },
  red: { block: "bg-accent-red", title: "text-accent-red-text" },
  grey: { block: "bg-body", title: "text-body" },
} as const;

type StatCardProps = {
  icon: IconType;
  tone: keyof typeof TONES;
  label: string;
  value: ReactNode;
  footer: ReactNode;
};

/**
 * A summary figure as a row, after the Capitec app's account list: a
 * coloured icon block on the left edge, the label and its context, and the
 * figure on the right.
 */
function StatCard({ icon: Icon, tone, label, value, footer }: StatCardProps) {
  return (
    <div className="flex min-h-20 overflow-hidden rounded-lg border border-slate-200/80 bg-white">
      <span
        className={`flex w-16 shrink-0 items-center justify-center text-white ${TONES[tone].block}`}
      >
        <Icon className="size-6" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 pl-4">
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${TONES[tone].title}`}>{label}</p>
          <div className="mt-0.5 text-xs text-body">{footer}</div>
        </div>
        <p className="shrink-0 text-lg font-bold text-heading">{value}</p>
      </div>
    </div>
  );
}

function ChangeFooter({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap items-center gap-1">
      <ChangeIndicator value={value} />
      <span>{t("dashboard.stats.vsPrevious")}</span>
    </span>
  );
}

export function StatCards({
  query,
  currency,
}: {
  query: UseQueryResult<SpendingSummary>;
  currency?: string;
}) {
  const { t } = useTranslation();

  if (query.isError) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white">
        <ErrorState onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const summary = query.data;
  const value = (render: (data: SpendingSummary) => string) =>
    summary ? render(summary) : <Skeleton className="h-6 w-20" />;
  const footer = (render: (data: SpendingSummary) => ReactNode) =>
    summary ? render(summary) : <Skeleton className="h-3 w-28" />;

  return (
    <div aria-busy={query.isPending} className="grid gap-3 sm:grid-cols-2">
      <StatCard
        tone="sky"
        icon={LuWallet}
        label={t("dashboard.stats.totalSpent")}
        value={value((s) => formatCurrency(s.totalSpent, currency))}
        footer={footer((s) => (
          <ChangeFooter value={s.comparedToPrevious.spentChange} />
        ))}
      />
      <StatCard
        tone="navy"
        icon={LuArrowLeftRight}
        label={t("dashboard.stats.transactionCount")}
        value={value((s) => formatCount(s.transactionCount))}
        footer={footer((s) => (
          <ChangeFooter value={s.comparedToPrevious.transactionChange} />
        ))}
      />
      <StatCard
        tone="red"
        icon={LuCoins}
        label={t("dashboard.stats.averageTransaction")}
        value={value((s) => formatCurrency(s.averageTransaction, currency))}
        footer={footer(() => t("dashboard.stats.perTransaction"))}
      />
      <StatCard
        tone="grey"
        icon={LuTrendingUp}
        label={t("dashboard.stats.spendingChange")}
        value={value((s) => formatChange(s.comparedToPrevious.spentChange))}
        footer={footer(() => t("dashboard.stats.vsPrevious"))}
      />
    </div>
  );
}
