import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuArrowRight } from "react-icons/lu";
import { Link } from "react-router";
import type { TransactionsPage } from "../../api/schemas";
import { Panel, QueryContent, Skeleton } from "./Panel";
import { TransactionsTable } from "./TransactionsTable";

/** Overview: the latest few transactions, linking to the full list. */
export function RecentTransactionsCard({
  query,
  currency,
  count,
}: {
  query: UseQueryResult<TransactionsPage>;
  currency?: string;
  /** How many transactions were requested, for the label. */
  count: number;
}) {
  const { t } = useTranslation();
  const hasTransactions = (query.data?.transactions.length ?? 0) > 0;

  return (
    <Panel
      title={t("dashboard.recent.title")}
      action={
        <span className="text-sm text-body">
          {t("dashboard.recent.lastCount", { count })}
        </span>
      }
    >
      <QueryContent
        query={query}
        loading={
          <div className="space-y-3">
            {Array.from({ length: count }, (_, row) => (
              <Skeleton key={row} className="h-9 w-full" />
            ))}
          </div>
        }
        isEmpty={(data) => data.transactions.length === 0}
        emptyMessage={t("dashboard.recent.empty")}
      >
        {({ transactions }) => (
          <TransactionsTable transactions={transactions} currency={currency} />
        )}
      </QueryContent>

      {hasTransactions && (
        <div className="mt-3 flex justify-end">
          <Link
            to="/dashboard/transactions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t("dashboard.recent.viewAll")}
            <LuArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </Panel>
  );
}
