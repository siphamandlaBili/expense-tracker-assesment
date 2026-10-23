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

type StatCardProps = {
  icon: IconType;
  label: string;
  value: ReactNode;
  footer: ReactNode;
};

function StatCard({ icon: Icon, label, value, footer }: StatCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-body">{label}</p>
        <p className="mt-1 text-2xl font-bold text-heading">{value}</p>
        <div className="mt-1 text-xs text-body">{footer}</div>
      </div>
    </div>
  );
}

function ChangeFooter({ value }: { value: number }) {
  const { t } = useTranslation();
  return (
    <p className="flex flex-wrap items-center gap-1">
      <ChangeIndicator value={value} />
      <span>{t("dashboard.stats.vsPrevious")}</span>
    </p>
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
      <div className="rounded-2xl border border-slate-200/80 bg-white">
        <ErrorState onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const summary = query.data;
  const value = (render: (data: SpendingSummary) => string) =>
    summary ? render(summary) : <Skeleton className="h-7 w-24" />;
  const footer = (render: (data: SpendingSummary) => ReactNode) =>
    summary ? render(summary) : <Skeleton className="h-3 w-28" />;

  return (
    <div
      aria-busy={query.isPending}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        icon={LuWallet}
        label={t("dashboard.stats.totalSpent")}
        value={value((s) => formatCurrency(s.totalSpent, currency))}
        footer={footer((s) => (
          <ChangeFooter value={s.comparedToPrevious.spentChange} />
        ))}
      />
      <StatCard
        icon={LuArrowLeftRight}
        label={t("dashboard.stats.transactionCount")}
        value={value((s) => formatCount(s.transactionCount))}
        footer={footer((s) => (
          <ChangeFooter value={s.comparedToPrevious.transactionChange} />
        ))}
      />
      <StatCard
        icon={LuCoins}
        label={t("dashboard.stats.averageTransaction")}
        value={value((s) => formatCurrency(s.averageTransaction, currency))}
        footer={footer(() => t("dashboard.stats.perTransaction"))}
      />
      <StatCard
        icon={LuTrendingUp}
        label={t("dashboard.stats.spendingChange")}
        value={value((s) => formatChange(s.comparedToPrevious.spentChange))}
        footer={footer(() => t("dashboard.stats.vsPrevious"))}
      />
    </div>
  );
}
