import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Period, SpendingSummary } from "../../api/schemas";
import { formatCount, formatCurrency } from "../../lib/format";
import { ChangeIndicator } from "../dashboard/ChangeIndicator";
import { DetailList } from "../dashboard/DetailList";
import { Panel, QueryContent, Skeleton } from "../dashboard/Panel";

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/** /spending/summary for the page's period, with the previous-period change. */
export function SpendingSummaryCard({
  query,
  period,
  currency,
}: {
  query: UseQueryResult<SpendingSummary>;
  period: Period;
  currency?: string;
}) {
  const { t } = useTranslation();

  return (
    <Panel title={t("spending.summary.title")}>
      <QueryContent
        query={query}
        loading={
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-4 w-48" />
          </div>
        }
      >
        {(summary) => (
          <div
            className={`flex flex-1 flex-col transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}
          >
            <p className="text-sm text-body">
              {t("spending.summary.totalSpent")}
            </p>
            <p className="mt-1 text-3xl font-bold text-heading">
              {formatCurrency(summary.totalSpent, currency)}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-body">
              <ChangeIndicator value={summary.comparedToPrevious.spentChange} />
              <span>
                {t("spending.summary.vsPrevious", {
                  days: PERIOD_DAYS[period],
                })}
              </span>
            </p>

            <DetailList
              className="mt-6 border-t border-slate-100"
              items={[
                {
                  label: t("spending.summary.transactions"),
                  value: formatCount(summary.transactionCount),
                },
                {
                  label: t("spending.summary.average"),
                  value: formatCurrency(summary.averageTransaction, currency),
                },
                {
                  label: t("spending.summary.topCategory"),
                  value: summary.topCategory ?? t("spending.summary.none"),
                },
              ]}
            />
          </div>
        )}
      </QueryContent>
    </Panel>
  );
}
