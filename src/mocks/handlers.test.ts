import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { authApi } from "../api/auth";
import { customersApi } from "../api/customers";
import { resetDb } from "./db";
import { CUSTOMER_ID, EMPTY_USER, ERROR_USER, MOCK_USERS } from "./fixtures";
import { TEST_NOW } from "../test/constants";

// Exercises the mock API through the real client, so these tests cover the
// request building, response validation and the mock's behaviour together.

const api = customersApi;

async function expectApiError(promise: Promise<unknown>, status: number) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  return error as ApiError;
}

describe("mock API: customers", () => {
  it("returns the profile with total spend derived from transactions", async () => {
    const profile = await api.getProfile(CUSTOMER_ID);
    const everything = await api.getTransactions(CUSTOMER_ID, { limit: 1 });

    expect(profile).toMatchObject({
      customerId: CUSTOMER_ID,
      name: "John Doe",
      currency: "ZAR",
    });
    expect(profile.totalSpent).toBeGreaterThan(0);
    expect(everything.pagination.total).toBeGreaterThan(1000);
  });

  it("returns 404 for an unknown customer", async () => {
    const error = await expectApiError(api.getProfile("99999"), 404);
    expect(error.message).toMatch(/not found/i);
  });
});

describe("mock API: spending", () => {
  it("defaults the summary to 30 days and compares with the previous period", async () => {
    const summary = await api.getSpendingSummary(CUSTOMER_ID);

    expect(summary.period).toBe("30d");
    expect(summary.transactionCount).toBeGreaterThan(0);
    expect(summary.averageTransaction).toBeCloseTo(
      summary.totalSpent / summary.transactionCount,
      1,
    );
    expect(typeof summary.comparedToPrevious.spentChange).toBe("number");
  });

  it("keeps summary, categories and transactions consistent", async () => {
    const summary = await api.getSpendingSummary(CUSTOMER_ID, "30d");
    const categories = await api.getSpendingByCategory(CUSTOMER_ID, {
      period: "30d",
    });
    const transactions = await api.getTransactions(CUSTOMER_ID, {
      ...categories.dateRange,
      limit: 1,
    });

    expect(categories.dateRange).toEqual({
      startDate: "2024-08-18",
      endDate: "2024-09-16",
    });
    expect(categories.totalAmount).toBe(summary.totalSpent);
    expect(transactions.pagination.total).toBe(summary.transactionCount);
    expect(summary.topCategory).toBe(categories.categories[0].name);

    const categorySum = categories.categories.reduce((s, c) => s + c.amount, 0);
    expect(categorySum).toBeCloseTo(categories.totalAmount, 1);
    const percentageSum = categories.categories.reduce(
      (s, c) => s + c.percentage,
      0,
    );
    expect(percentageSum).toBeCloseTo(100, 0);
  });

  it("sorts categories by amount and includes their colour and icon", async () => {
    const { categories } = await api.getSpendingByCategory(CUSTOMER_ID);

    const amounts = categories.map((c) => c.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    expect(categories.find((c) => c.name === "Groceries")).toMatchObject({
      color: "#FF6B6B",
      icon: "shopping-cart",
    });
  });

  it("uses a custom date range over the period when both dates are given", async () => {
    const custom = await api.getSpendingByCategory(CUSTOMER_ID, {
      period: "1y",
      startDate: "2024-09-01",
      endDate: "2024-09-10",
    });

    expect(custom.dateRange).toEqual({
      startDate: "2024-09-01",
      endDate: "2024-09-10",
    });
  });

  it("rejects an invalid period and a reversed date range", async () => {
    await expectApiError(
      api.getSpendingSummary(CUSTOMER_ID, "2w" as never),
      400,
    );
    await expectApiError(
      api.getSpendingByCategory(CUSTOMER_ID, {
        startDate: "2024-09-10",
        endDate: "2024-09-01",
      }),
      400,
    );
  });

  it("returns 12 months of trends by default, oldest first, up to 24", async () => {
    const { trends } = await api.getSpendingTrends(CUSTOMER_ID);
    expect(trends).toHaveLength(12);
    expect(trends[0].month).toBe("2023-10");
    expect(trends[11].month).toBe("2024-09");

    const max = await api.getSpendingTrends(CUSTOMER_ID, 24);
    expect(max.trends).toHaveLength(24);
    expect(max.trends.every((t) => t.transactionCount > 0)).toBe(true);

    await expectApiError(api.getSpendingTrends(CUSTOMER_ID, 25), 400);
  });
});

describe("mock API: transactions", () => {
  it("defaults to 20 newest first and paginates", async () => {
    const first = await api.getTransactions(CUSTOMER_ID);
    const second = await api.getTransactions(CUSTOMER_ID, { offset: 20 });

    expect(first.transactions).toHaveLength(20);
    expect(first.pagination).toMatchObject({
      limit: 20,
      offset: 0,
      hasMore: true,
    });

    const dates = first.transactions.map((t) => t.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(second.transactions[0].date <= dates[19]).toBe(true);
    expect(second.transactions[0].id).not.toBe(first.transactions[19].id);
  });

  it("reports hasMore false on the last page", async () => {
    const { pagination } = await api.getTransactions(CUSTOMER_ID, { limit: 1 });
    const last = await api.getTransactions(CUSTOMER_ID, {
      limit: 5,
      offset: pagination.total - 3,
    });

    expect(last.transactions).toHaveLength(3);
    expect(last.pagination.hasMore).toBe(false);
  });

  it("filters by category and date range, and sorts by amount", async () => {
    const { transactions } = await api.getTransactions(CUSTOMER_ID, {
      category: "Dining",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      sortBy: "amount_desc",
      limit: 100,
    });

    expect(transactions.length).toBeGreaterThan(0);
    for (const txn of transactions) {
      expect(txn.category).toBe("Dining");
      expect(txn.date >= "2024-06-01" && txn.date < "2024-07-01").toBe(true);
    }
    const amounts = transactions.map((t) => t.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it.each([
    [{ limit: 101 }],
    [{ limit: 0 }],
    [{ offset: -1 }],
    [{ category: "Pets" }],
    [{ sortBy: "merchant" as never }],
    [{ startDate: "16-09-2024" }],
  ])("rejects invalid filters %j", async (filters) => {
    await expectApiError(api.getTransactions(CUSTOMER_ID, filters), 400);
  });
});

describe("mock API: goals", () => {
  it("derives progress and status from this month's transactions", async () => {
    const { goals } = await api.getGoals(CUSTOMER_ID);

    expect(goals.map((g) => g.category)).toEqual([
      "Entertainment",
      "Groceries",
    ]);
    for (const goal of goals) {
      expect(goal.percentageUsed).toBeCloseTo(
        (goal.currentSpent / goal.monthlyBudget) * 100,
        1,
      );
      expect(goal.daysRemaining).toBe(14);
      expect(["on_track", "warning", "exceeded"]).toContain(goal.status);
    }
  });

  it("creates, updates and deletes a goal", async () => {
    const created = await api.createGoal(CUSTOMER_ID, {
      category: "Dining",
      monthlyBudget: 800,
    });
    expect(created).toMatchObject({ id: "goal_003", category: "Dining" });

    const updated = await api.updateGoal(CUSTOMER_ID, created.id, {
      monthlyBudget: 100,
    });
    expect(updated.monthlyBudget).toBe(100);
    expect(updated.percentageUsed).toBeGreaterThan(created.percentageUsed);

    await api.deleteGoal(CUSTOMER_ID, created.id);
    const { goals } = await api.getGoals(CUSTOMER_ID);
    expect(goals.map((g) => g.id)).not.toContain(created.id);
  });

  it("rejects duplicates, unknown categories, bad budgets and unknown goals", async () => {
    await expectApiError(
      api.createGoal(CUSTOMER_ID, { category: "Groceries", monthlyBudget: 1 }),
      409,
    );
    await expectApiError(
      api.createGoal(CUSTOMER_ID, { category: "Pets", monthlyBudget: 100 }),
      400,
    );
    await expectApiError(
      api.createGoal(CUSTOMER_ID, { category: "Dining", monthlyBudget: -5 }),
      400,
    );
    await expectApiError(
      api.updateGoal(CUSTOMER_ID, "goal_999", { monthlyBudget: 100 }),
      404,
    );
    await expectApiError(api.deleteGoal(CUSTOMER_ID, "goal_999"), 404);
  });

  it("persists goal changes across a reload", async () => {
    await api.createGoal(CUSTOMER_ID, {
      category: "Dining",
      monthlyBudget: 800,
    });

    resetDb({ now: TEST_NOW });

    const { goals } = await api.getGoals(CUSTOMER_ID);
    expect(goals.map((g) => g.category)).toContain("Dining");
  });
});

describe("mock API: filters", () => {
  it("returns the categories and date presets", async () => {
    const filters = await api.getFilters(CUSTOMER_ID);

    expect(filters.categories).toHaveLength(6);
    expect(filters.dateRangePresets.map((p) => p.value)).toEqual([
      "7d",
      "30d",
      "90d",
      "1y",
    ]);
  });
});

describe("mock API: sign in", () => {
  it.each(MOCK_USERS)(
    "signs in $profile.name ($scenario)",
    async ({ accountNumber, pin, customerId, profile }) => {
      await expect(authApi.signIn({ accountNumber, pin })).resolves.toEqual({
        customerId,
        name: profile.name,
      });
    },
  );

  it("rejects a wrong PIN or unknown account with 401", async () => {
    await expectApiError(
      authApi.signIn({
        accountNumber: MOCK_USERS[0].accountNumber,
        pin: "00000",
      }),
      401,
    );
    await expectApiError(
      authApi.signIn({ accountNumber: "99999999999999", pin: "12345" }),
      401,
    );
  });
});

describe("mock API: scenarios", () => {
  it("returns empty data for the customer with no transactions", async () => {
    const id = EMPTY_USER.customerId;

    const summary = await api.getSpendingSummary(id);
    expect(summary).toMatchObject({
      totalSpent: 0,
      transactionCount: 0,
      topCategory: null,
    });
    expect((await api.getSpendingByCategory(id)).categories).toEqual([]);
    expect((await api.getTransactions(id)).pagination.total).toBe(0);
    expect((await api.getGoals(id)).goals).toEqual([]);
    const { trends } = await api.getSpendingTrends(id, 3);
    expect(trends.every((month) => month.totalSpent === 0)).toBe(true);
  });

  it("fails spending endpoints with 500 but keeps the profile working for the error customer", async () => {
    const id = ERROR_USER.customerId;

    await expect(api.getProfile(id)).resolves.toMatchObject({
      name: "Pieter van Wyk",
    });
    await expectApiError(api.getSpendingSummary(id), 500);
    await expectApiError(api.getTransactions(id), 500);
    await expectApiError(api.getGoals(id), 500);
  });

  it("keeps each customer's goals separate", async () => {
    await api.createGoal(EMPTY_USER.customerId, {
      category: "Dining",
      monthlyBudget: 500,
    });

    const active = await api.getGoals(CUSTOMER_ID);
    expect(active.goals.map((g) => g.category)).not.toContain("Dining");
  });
});
