import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import type { CategoryMeta, SpendingByCategory } from "../../api/schemas";
import { formatCount, formatCurrency, formatPercent } from "../../lib/format";
import type { DateRange } from "../../lib/dateRange";
import { CategoryDonut } from "../charts/CategoryDonut";
import { CategoryBadge } from "../dashboard/CategoryBadge";
import { DateRangeFields } from "../dashboard/DateRangeFields";
import { EmptyState, Panel, QueryContent, Skeleton } from "../dashboard/Panel";

type CategoryAnalysisCardProps = {
  query: UseQueryResult<SpendingByCategory>;
  /** Every category the customer can filter by (from /filters). */
  allCategories: CategoryMeta[];
  /** Selected category names; empty means all. */
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  /**
   * Custom dates for this card only: /spending/categories is the one endpoint
   * on the page that accepts startDate/endDate. Undefined uses the period;
   * choosing a period on the page clears them.
   */
  customDates?: DateRange;
  onCustomDatesChange: (dates: DateRange) => void;
  currency?: string;
};

// Columns drop out as the card narrows, least important first (container
// queries), so the table never scrolls sideways.
const COLUMN = {
  percentage: "hidden @md:table-cell",
  transactions: "hidden @lg:table-cell",
};

/** Toggle chip; a tick marks the active ones (not just colour). */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary-light text-primary"
          : "border-slate-200 bg-white text-heading hover:border-primary hover:text-primary"
      }`}
    >
      {active && <LuCheck className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

/**
 * Full category table with a donut. Date filtering uses the API (period or
 * custom dates); the category chips filter the response for display.
 */
export function CategoryAnalysisCard({
  query,
  allCategories,
  selected,
  onSelectedChange,
  customDates,
  onCustomDatesChange,
  currency,
}: CategoryAnalysisCardProps) {
  const { t } = useTranslation();

  const toggle = (name: string) =>
    onSelectedChange(
      selected.includes(name)
        ? selected.filter((item) => item !== name)
        : [...selected, name],
    );

  return (
    <Panel
      title={t("spending.categories.title")}
      action={
        <DateRangeFields
          label={t("spending.customRange.label")}
          hint={t("spending.customRange.hint")}
          dates={customDates ?? query.data?.dateRange}
          active={Boolean(customDates)}
          onApply={onCustomDatesChange}
        />
      }
    >
      {allCategories.length > 0 && (
        <div
          role="group"
          aria-label={t("spending.categories.filterLabel")}
          className="-mt-1 mb-4 flex flex-wrap gap-2"
        >
          <FilterChip
            active={selected.length === 0}
            onClick={() => onSelectedChange([])}
          >
            {t("spending.categories.all")}
          </FilterChip>
          {allCategories.map((category) => (
            <FilterChip
              key={category.name}
              active={selected.includes(category.name)}
              onClick={() => toggle(category.name)}
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
      )}

      <QueryContent
        query={query}
        loading={
          <div className="flex items-center gap-6">
            <div className="flex-1 space-y-3">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-8 w-full" />
              ))}
            </div>
            <Skeleton className="hidden size-44 rounded-full sm:block" />
          </div>
        }
        isEmpty={(data) => data.categories.length === 0}
        emptyMessage={t("spending.categories.empty")}
      >
        {({ categories }) => {
          const shown =
            selected.length === 0
              ? categories
              : categories.filter((category) =>
                  selected.includes(category.name),
                );
          if (shown.length === 0) {
            return (
              <EmptyState message={t("spending.categories.noneSelected")} />
            );
          }
          const shownTotal = shown.reduce((sum, c) => sum + c.amount, 0);

          return (
            <div className="@container">
              <div className="flex flex-col items-center gap-6 @3xl:flex-row @3xl:items-center @3xl:gap-10">
                <div className="-mx-4 w-[calc(100%+2rem)] flex-1 sm:-mx-5 sm:w-[calc(100%+2.5rem)] @3xl:mx-0 @3xl:w-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      {t("spending.categories.title")}
                    </caption>
                    <thead>
                      <tr className="bg-dashboard text-xs font-semibold text-body">
                        <th scope="col" className="px-4 py-2.5 sm:px-5">
                          {t("spending.categories.category")}
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right">
                          {t("spending.categories.amount")}
                        </th>
                        <th
                          scope="col"
                          className={`${COLUMN.percentage} px-4 py-2.5 text-right`}
                        >
                          {t("spending.categories.percentage")}
                        </th>
                        <th
                          scope="col"
                          className={`${COLUMN.transactions} px-4 py-2.5 text-right sm:px-5`}
                        >
                          {t("spending.categories.transactions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shown.map((category) => (
                        <tr key={category.name}>
                          <th
                            scope="row"
                            className="px-4 py-3 text-left font-normal text-heading sm:px-5"
                          >
                            <span className="flex items-center gap-2">
                              {/* Tinted: it's the donut's legend key. */}
                              <CategoryBadge
                                category={category.name}
                                icon={category.icon}
                                tinted
                              />
                              {category.name}
                            </span>
                          </th>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-heading">
                            {formatCurrency(category.amount, currency)}
                          </td>
                          <td
                            className={`${COLUMN.percentage} px-4 py-3 text-right text-body`}
                          >
                            {formatPercent(category.percentage)}
                          </td>
                          <td
                            className={`${COLUMN.transactions} px-4 py-3 text-right text-body sm:px-5`}
                          >
                            {formatCount(category.transactionCount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <CategoryDonut
                  categories={shown}
                  total={shownTotal}
                  totalLabel={
                    selected.length === 0
                      ? t("spending.categories.total")
                      : t("spending.categories.selectedTotal")
                  }
                  label={t("spending.categories.chartLabel")}
                  currency={currency}
                  className="size-48 @lg:size-52"
                />
              </div>
            </div>
          );
        }}
      </QueryContent>
    </Panel>
  );
}
