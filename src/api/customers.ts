import { apiRequest } from "./client";
import {
  customerProfileSchema,
  filtersSchema,
  goalSchema,
  goalsSchema,
  spendingByCategorySchema,
  spendingSummarySchema,
  spendingTrendsSchema,
  transactionsPageSchema,
  type CreateGoalInput,
  type Period,
  type SortBy,
  type UpdateGoalInput,
} from "./schemas";

export type CategoryParams = {
  period?: Period;
  /** YYYY-MM-DD; overrides `period` when both dates are set. */
  startDate?: string;
  endDate?: string;
};

export type TransactionFilters = {
  limit?: number;
  offset?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: SortBy;
};

const customerPath = (customerId: string) =>
  `/customers/${encodeURIComponent(customerId)}`;

export const customersApi = {
  getProfile: (customerId: string, signal?: AbortSignal) =>
    apiRequest(`${customerPath(customerId)}/profile`, {
      signal,
      schema: customerProfileSchema,
    }),

  getSpendingSummary: (
    customerId: string,
    period?: Period,
    signal?: AbortSignal,
  ) =>
    apiRequest(`${customerPath(customerId)}/spending/summary`, {
      query: { period },
      signal,
      schema: spendingSummarySchema,
    }),

  getSpendingByCategory: (
    customerId: string,
    params: CategoryParams = {},
    signal?: AbortSignal,
  ) =>
    apiRequest(`${customerPath(customerId)}/spending/categories`, {
      query: params,
      signal,
      schema: spendingByCategorySchema,
    }),

  getSpendingTrends: (
    customerId: string,
    months?: number,
    signal?: AbortSignal,
  ) =>
    apiRequest(`${customerPath(customerId)}/spending/trends`, {
      query: { months },
      signal,
      schema: spendingTrendsSchema,
    }),

  getTransactions: (
    customerId: string,
    filters: TransactionFilters = {},
    signal?: AbortSignal,
  ) =>
    apiRequest(`${customerPath(customerId)}/transactions`, {
      query: filters,
      signal,
      schema: transactionsPageSchema,
    }),

  getGoals: (customerId: string, signal?: AbortSignal) =>
    apiRequest(`${customerPath(customerId)}/goals`, {
      signal,
      schema: goalsSchema,
    }),

  getFilters: (customerId: string, signal?: AbortSignal) =>
    apiRequest(`${customerPath(customerId)}/filters`, {
      signal,
      schema: filtersSchema,
    }),

  createGoal: (customerId: string, input: CreateGoalInput) =>
    apiRequest(`${customerPath(customerId)}/goals`, {
      method: "POST",
      body: input,
      schema: goalSchema,
    }),

  updateGoal: (customerId: string, goalId: string, input: UpdateGoalInput) =>
    apiRequest(
      `${customerPath(customerId)}/goals/${encodeURIComponent(goalId)}`,
      { method: "PATCH", body: input, schema: goalSchema },
    ),

  deleteGoal: (customerId: string, goalId: string) =>
    apiRequest(
      `${customerPath(customerId)}/goals/${encodeURIComponent(goalId)}`,
      { method: "DELETE" },
    ),
};
