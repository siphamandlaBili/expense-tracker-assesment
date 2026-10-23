import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  useFilters,
  useProfile,
  useSpendingByCategory,
  useSpendingSummary,
  useSpendingTrends,
} from "../../api/queries";
import { PERIODS } from "../../api/schemas";
import { useSession } from "../../auth/AuthContext";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { SpendingTrendCard } from "../../components/dashboard/SpendingTrendCard";
import { CategoryAnalysisCard } from "../../components/spending/CategoryAnalysisCard";
import { PeriodFilter } from "../../components/spending/PeriodFilter";
import { SpendingSummaryCard } from "../../components/spending/SpendingSummaryCard";
import { TrendMonthsSelect } from "../../components/spending/TrendMonthsSelect";
import {
  categoryParams,
  readSpendingFilters,
  writeSpendingFilters,
  type SpendingFilters,
} from "../../lib/spendingFilters";

/**
 * Each card is driven only by the filters its endpoint accepts:
 * - period buttons    -> /spending/summary?period and /spending/categories?period
 * - months picker     -> /spending/trends?months
 * - custom dates      -> /spending/categories?startDate&endDate (that card only)
 * - category chips    -> display filter on the categories response
 */
export function SpendingPage() {
  const { t } = useTranslation();
  const { customerId } = useSession();

  // Filters live in the URL, so a filtered view can be shared or bookmarked.
  const [params, setParams] = useSearchParams();
  const filters = readSpendingFilters(params);
  const update = (next: Partial<SpendingFilters>) =>
    setParams(writeSpendingFilters({ ...filters, ...next }), { replace: true });

  const filterOptions = useFilters(customerId);
  const profile = useProfile(customerId);
  const summary = useSpendingSummary(customerId, filters.period);
  const trends = useSpendingTrends(customerId, filters.months);
  const categories = useSpendingByCategory(customerId, categoryParams(filters));

  const currency = profile.data?.currency;
  const presets =
    filterOptions.data?.dateRangePresets.map((preset) => preset.value) ??
    PERIODS;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("spending.title")}
        subtitle={t("spending.subtitle")}
      />

      <PeriodFilter
        period={filters.period}
        presets={presets}
        // Choosing a period also returns the category card to that period.
        onChange={(period) => update({ period, categoryDates: undefined })}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <SpendingTrendCard
          query={trends}
          className="xl:col-span-2"
          action={
            <TrendMonthsSelect
              value={filters.months}
              onChange={(months) => update({ months })}
            />
          }
        />
        <SpendingSummaryCard
          query={summary}
          period={filters.period}
          currency={currency}
        />
      </div>

      <CategoryAnalysisCard
        query={categories}
        allCategories={filterOptions.data?.categories ?? []}
        selected={filters.categories}
        onSelectedChange={(selected) => update({ categories: selected })}
        customDates={filters.categoryDates}
        onCustomDatesChange={(categoryDates) => update({ categoryDates })}
        currency={currency}
      />
    </div>
  );
}
