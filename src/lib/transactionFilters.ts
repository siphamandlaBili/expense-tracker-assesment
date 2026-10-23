import { z } from "zod";
import type { TransactionFilters } from "../api/customers";
import { isoDateSchema, sortBySchema, type SortBy } from "../api/schemas";
import type { DateRange } from "./dateRange";

/**
 * Transactions page state, mapped onto the /transactions contract:
 * category, startDate/endDate, sortBy, and limit/offset for paging.
 */
export type TransactionsView = {
  category?: string;
  dates?: DateRange;
  sortBy: SortBy;
  /** 1-based. */
  page: number;
  pageSize: PageSize;
};

/** Page sizes offered in the UI; the API allows up to 100. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
/** The API's default `limit`. */
export const DEFAULT_PAGE_SIZE: PageSize = 20;
/** The API's default `sortBy`. */
export const DEFAULT_SORT: SortBy = "date_desc";

const searchSchema = z.object({
  category: z.string().min(1).optional().catch(undefined),
  from: isoDateSchema.optional().catch(undefined),
  to: isoDateSchema.optional().catch(undefined),
  sortBy: sortBySchema.catch(DEFAULT_SORT),
  page: z.coerce.number().int().min(1).catch(1),
  size: z.coerce
    .number()
    .refine((value): value is PageSize =>
      (PAGE_SIZE_OPTIONS as readonly number[]).includes(value),
    )
    .catch(DEFAULT_PAGE_SIZE),
});

/** Reads the view from the URL; anything invalid falls back to the default. */
export function readTransactionsView(
  params: URLSearchParams,
): TransactionsView {
  const search = searchSchema.parse(Object.fromEntries(params));
  return {
    category: search.category,
    dates:
      search.from && search.to && search.from <= search.to
        ? { startDate: search.from, endDate: search.to }
        : undefined,
    sortBy: search.sortBy,
    page: search.page,
    pageSize: search.size as PageSize,
  };
}

/** The URL search params for a view (defaults are left out). */
export function writeTransactionsView(view: TransactionsView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.category) params.set("category", view.category);
  if (view.dates) {
    params.set("from", view.dates.startDate);
    params.set("to", view.dates.endDate);
  }
  if (view.sortBy !== DEFAULT_SORT) params.set("sortBy", view.sortBy);
  if (view.page > 1) params.set("page", String(view.page));
  if (view.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("size", String(view.pageSize));
  }
  return params;
}

/** Query params for /transactions. */
export function toTransactionFilters(
  view: TransactionsView,
): TransactionFilters {
  return {
    limit: view.pageSize,
    offset: (view.page - 1) * view.pageSize,
    sortBy: view.sortBy,
    category: view.category,
    startDate: view.dates?.startDate,
    endDate: view.dates?.endDate,
  };
}

/** Number of pages for `total` items (at least 1). */
export const pageCount = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize));
