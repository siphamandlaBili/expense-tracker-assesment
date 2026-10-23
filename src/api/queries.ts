import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  customersApi,
  type CategoryParams,
  type TransactionFilters,
} from "./customers";
import type { Period } from "./schemas";

// Hierarchical keys: invalidating `customer(id)` refreshes everything for
// that customer, `spending(id)` refreshes every spending view, and so on.
export const queryKeys = {
  customer: (customerId: string) => ["customers", customerId] as const,
  profile: (customerId: string) =>
    [...queryKeys.customer(customerId), "profile"] as const,
  spending: (customerId: string) =>
    [...queryKeys.customer(customerId), "spending"] as const,
  summary: (customerId: string, period?: Period) =>
    [...queryKeys.spending(customerId), "summary", { period }] as const,
  categories: (customerId: string, params: CategoryParams) =>
    [...queryKeys.spending(customerId), "categories", params] as const,
  trends: (customerId: string, months?: number) =>
    [...queryKeys.spending(customerId), "trends", { months }] as const,
  transactions: (customerId: string, filters: TransactionFilters) =>
    [...queryKeys.customer(customerId), "transactions", filters] as const,
  goals: (customerId: string) =>
    [...queryKeys.customer(customerId), "goals"] as const,
  filters: (customerId: string) =>
    [...queryKeys.customer(customerId), "filters"] as const,
};

export function useProfile(customerId: string) {
  return useQuery({
    queryKey: queryKeys.profile(customerId),
    queryFn: ({ signal }) => customersApi.getProfile(customerId, signal),
  });
}

export function useSpendingSummary(customerId: string, period?: Period) {
  return useQuery({
    queryKey: queryKeys.summary(customerId, period),
    queryFn: ({ signal }) =>
      customersApi.getSpendingSummary(customerId, period, signal),
    // Keep the current figures visible while another period loads.
    placeholderData: keepPreviousData,
  });
}

export function useSpendingByCategory(
  customerId: string,
  params: CategoryParams = {},
) {
  return useQuery({
    queryKey: queryKeys.categories(customerId, params),
    queryFn: ({ signal }) =>
      customersApi.getSpendingByCategory(customerId, params, signal),
    // Keep the current breakdown (and its date range) visible while a new
    // period loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  });
}

export function useSpendingTrends(customerId: string, months?: number) {
  return useQuery({
    queryKey: queryKeys.trends(customerId, months),
    queryFn: ({ signal }) =>
      customersApi.getSpendingTrends(customerId, months, signal),
    // Keep the current chart visible while a new range loads.
    placeholderData: keepPreviousData,
  });
}

export function useTransactions(
  customerId: string,
  filters: TransactionFilters = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.transactions(customerId, filters),
    queryFn: ({ signal }) =>
      customersApi.getTransactions(customerId, filters, signal),
    enabled,
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useGoals(customerId: string) {
  return useQuery({
    queryKey: queryKeys.goals(customerId),
    queryFn: ({ signal }) => customersApi.getGoals(customerId, signal),
  });
}

export function useFilters(customerId: string) {
  return useQuery({
    queryKey: queryKeys.filters(customerId),
    queryFn: ({ signal }) => customersApi.getFilters(customerId, signal),
    // Category and preset lists rarely change.
    staleTime: Infinity,
  });
}
