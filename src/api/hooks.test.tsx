import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { CUSTOMER_ID } from "../mocks/fixtures";
import { server } from "../mocks/server";
import { renderHookWithProviders } from "../test/render";
import { useCreateGoal, useDeleteGoal, useUpdateGoal } from "./mutations";
import {
  queryKeys,
  useFilters,
  useGoals,
  useProfile,
  useSpendingByCategory,
  useSpendingSummary,
  useSpendingTrends,
  useTransactions,
} from "./queries";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Goals } from "./schemas";

describe("query hooks", () => {
  it.each<[string, () => UseQueryResult<unknown>]>([
    ["useProfile", () => useProfile(CUSTOMER_ID)],
    ["useSpendingSummary", () => useSpendingSummary(CUSTOMER_ID, "7d")],
    ["useSpendingByCategory", () => useSpendingByCategory(CUSTOMER_ID)],
    ["useSpendingTrends", () => useSpendingTrends(CUSTOMER_ID, 6)],
    ["useTransactions", () => useTransactions(CUSTOMER_ID, { limit: 5 })],
    ["useGoals", () => useGoals(CUSTOMER_ID)],
    ["useFilters", () => useFilters(CUSTOMER_ID)],
  ])("%s loads data from the API", async (_name, useHook) => {
    const { result } = renderHookWithProviders(useHook);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it("exposes API errors", async () => {
    const { result } = renderHookWithProviders(() => useProfile("unknown"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 404 });
  });

  it("keeps the previous page visible while the next page loads", async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ offset }: { offset: number }) =>
        useTransactions(CUSTOMER_ID, { limit: 5, offset }),
      { initialProps: { offset: 0 } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const firstPage = result.current.data;

    rerender({ offset: 5 });

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data).toBe(firstPage);
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data?.pagination.offset).toBe(5);
  });
});

describe("goal mutations", () => {
  async function renderWithGoals<T>(useMutationHook: () => T) {
    const utils = renderHookWithProviders(() => ({
      goals: useGoals(CUSTOMER_ID),
      mutation: useMutationHook(),
    }));
    await waitFor(() =>
      expect(utils.result.current.goals.isSuccess).toBe(true),
    );
    return utils;
  }

  it("useCreateGoal refreshes the goals list", async () => {
    const { result } = await renderWithGoals(() => useCreateGoal(CUSTOMER_ID));

    result.current.mutation.mutate({ category: "Dining", monthlyBudget: 800 });

    await waitFor(() =>
      expect(result.current.goals.data?.goals.map((g) => g.category)).toContain(
        "Dining",
      ),
    );
  });

  it("useUpdateGoal writes the recalculated goal into the cache", async () => {
    const { result, queryClient } = await renderWithGoals(() =>
      useUpdateGoal(CUSTOMER_ID),
    );

    result.current.mutation.mutate({ goalId: "goal_002", monthlyBudget: 1 });

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));
    const cached = queryClient.getQueryData<Goals>(
      queryKeys.goals(CUSTOMER_ID),
    );
    expect(cached?.goals.find((g) => g.id === "goal_002")).toMatchObject({
      monthlyBudget: 1,
      status: "exceeded",
    });
  });

  it("useDeleteGoal removes the goal immediately", async () => {
    const { result } = await renderWithGoals(() => useDeleteGoal(CUSTOMER_ID));

    result.current.mutation.mutate("goal_001");

    await waitFor(() =>
      expect(result.current.goals.data?.goals.map((g) => g.id)).toEqual([
        "goal_002",
      ]),
    );
    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true));
  });

  it("useDeleteGoal restores the goal if the request fails", async () => {
    server.use(
      http.delete("*/goals/:goalId", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );
    const { result } = await renderWithGoals(() => useDeleteGoal(CUSTOMER_ID));

    result.current.mutation.mutate("goal_001");

    await waitFor(() => expect(result.current.mutation.isError).toBe(true));
    expect(result.current.goals.data?.goals.map((g) => g.id)).toEqual([
      "goal_001",
      "goal_002",
    ]);
  });
});
