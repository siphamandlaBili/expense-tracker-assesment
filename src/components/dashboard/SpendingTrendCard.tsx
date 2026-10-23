import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SpendingTrends } from "../../api/schemas";
import { formatMonthLong, formatMonthShort } from "../../lib/format";
import { TrendChart } from "../charts/TrendChart";
import { Panel, QueryContent, Skeleton } from "./Panel";

/**
 * Total spend per month, from /spending/trends. `action` sits top right: a
 * fixed label on the overview, a months picker on the Spending page.
 */
export function SpendingTrendCard({
  query,
  action,
  className,
}: {
  query: UseQueryResult<SpendingTrends>;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Panel
      title={t("dashboard.trend.title")}
      action={action}
      className={className}
    >
      <QueryContent
        query={query}
        loading={<Skeleton className="h-60 w-full" />}
        isEmpty={(data) => data.trends.every((m) => m.transactionCount === 0)}
        emptyMessage={t("dashboard.trend.empty")}
      >
        {({ trends }) => (
          <TrendChart
            data={trends.map((month) => ({
              key: month.month,
              value: month.totalSpent,
            }))}
            label={t("dashboard.trend.chartLabel")}
            valueLabel={t("dashboard.trend.spent")}
            keyLabel={t("dashboard.trend.month")}
            formatTick={formatMonthShort}
            formatKey={formatMonthLong}
            dimmed={query.isPlaceholderData}
          />
        )}
      </QueryContent>
    </Panel>
  );
}
