import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { SpendingByCategory } from "../../api/schemas";
import { formatCurrency, formatPercent } from "../../lib/format";
import { CategoryDonut } from "../charts/CategoryDonut";
import { CategoryBadge } from "./CategoryBadge";
import { Panel, QueryContent, Skeleton } from "./Panel";

/** Overview: donut of the last 30 days by category, with a compact legend. */
export function CategoryBreakdownCard({
  query,
  currency,
}: {
  query: UseQueryResult<SpendingByCategory>;
  currency?: string;
}) {
  const { t } = useTranslation();

  return (
    <Panel
      title={t("dashboard.categories.title")}
      action={
        <span className="text-sm text-body">
          {t("dashboard.categories.period")}
        </span>
      }
    >
      <QueryContent
        query={query}
        loading={
          <div className="flex items-center gap-6">
            <Skeleton className="size-40 rounded-full" />
            <div className="flex-1 space-y-3">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-4 w-full" />
              ))}
            </div>
          </div>
        }
        isEmpty={(data) => data.categories.length === 0}
        emptyMessage={t("dashboard.categories.empty")}
      >
        {({ categories, totalAmount }) => (
          // Donut and legend side by side, centred as a group, whenever the card
          // is wide enough (container query); a phone-width card stacks them.
          <div className="@container flex flex-1 items-center">
            <div className="flex w-full flex-col items-center justify-center gap-5 @sm:flex-row @lg:gap-10">
              <CategoryDonut
                categories={categories}
                total={totalAmount}
                totalLabel={t("dashboard.categories.totalSpent")}
                label={t("dashboard.categories.chartLabel")}
                currency={currency}
                className="size-44 @sm:size-36 @md:size-40 @lg:size-48"
              />

              {/* The legend doubles as the data table. The share is shown
                  here too: touch screens can't hover the donut. */}
              <table className="text-sm">
                <caption className="sr-only">
                  {t("dashboard.categories.title")}
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{t("dashboard.categories.category")}</th>
                    <th scope="col">{t("dashboard.categories.share")}</th>
                    <th scope="col">{t("dashboard.categories.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.name}>
                      <th
                        scope="row"
                        className="py-1.5 pr-2 text-left font-normal text-heading"
                      >
                        <span className="flex items-center gap-2">
                          <CategoryBadge
                            category={category.name}
                            icon={category.icon}
                            size="sm"
                            tinted
                          />
                          {category.name}
                        </span>
                      </th>
                      <td className="py-1.5 pl-3 text-right whitespace-nowrap text-body tabular-nums">
                        {formatPercent(category.percentage)}
                      </td>
                      <td className="py-1.5 pl-3 text-right font-medium whitespace-nowrap text-heading">
                        {formatCurrency(category.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </QueryContent>
    </Panel>
  );
}
