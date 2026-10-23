import { z } from "zod";
import type { CategoryParams } from "../api/customers";
import { isoDateSchema, periodSchema, type Period } from "../api/schemas";
import type { DateRange } from "./dateRange";

/**
 * Spending page filters, shaped by what each endpoint accepts:
 * - /spending/summary     period
 * - /spending/categories  period, or startDate + endDate (custom dates)
 * - /spending/trends      months (1-24)
 * Category selection is a display filter on the categories response; no
 * endpoint on this page takes a category.
 */
export type SpendingFilters = {
  period: Period;
  /** Months of trend history. */
  months: TrendMonths;
  /** Custom dates for the category breakdown only; overrides `period` there. */
  categoryDates?: DateRange;
  /** Categories to show; empty means all. */
  categories: string[];
};

export const DEFAULT_PERIOD: Period = "30d";

/** Trend lengths offered in the UI; the API allows 1 to 24. */
export const TREND_MONTH_OPTIONS = [3, 6, 12, 24] as const;
export type TrendMonths = (typeof TREND_MONTH_OPTIONS)[number];
/** The API's default for `months`. */
export const DEFAULT_TREND_MONTHS: TrendMonths = 12;

const trendMonthsSchema = z.coerce
  .number()
  .refine((value): value is TrendMonths =>
    (TREND_MONTH_OPTIONS as readonly number[]).includes(value),
  );

const searchSchema = z.object({
  period: periodSchema.catch(DEFAULT_PERIOD),
  months: trendMonthsSchema.catch(DEFAULT_TREND_MONTHS),
  from: isoDateSchema.optional().catch(undefined),
  to: isoDateSchema.optional().catch(undefined),
  categories: z.string().optional().catch(undefined),
});

/**
 * Reads the Spending page filters from the URL. Anything invalid falls back
 * to the default, so a hand-edited or stale link never breaks the page.
 */
export function readSpendingFilters(params: URLSearchParams): SpendingFilters {
  const search = searchSchema.parse(Object.fromEntries(params));
  const categoryDates =
    search.from && search.to && search.from <= search.to
      ? { startDate: search.from, endDate: search.to }
      : undefined;

  return {
    period: search.period,
    months: search.months as TrendMonths,
    categoryDates,
    categories: search.categories?.split(",").filter(Boolean) ?? [],
  };
}

/** The URL search params for a set of filters (defaults are left out). */
export function writeSpendingFilters({
  period,
  months,
  categoryDates,
  categories,
}: SpendingFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (period !== DEFAULT_PERIOD) params.set("period", period);
  if (months !== DEFAULT_TREND_MONTHS) params.set("months", String(months));
  if (categoryDates) {
    params.set("from", categoryDates.startDate);
    params.set("to", categoryDates.endDate);
  }
  if (categories.length > 0) params.set("categories", categories.join(","));
  return params;
}

/** Query params for /spending/categories: custom dates win over the period. */
export function categoryParams({
  period,
  categoryDates,
}: Pick<SpendingFilters, "period" | "categoryDates">): CategoryParams {
  return categoryDates ? { ...categoryDates } : { period };
}
