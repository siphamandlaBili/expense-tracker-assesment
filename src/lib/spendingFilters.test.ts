import { describe, expect, it } from "vitest";
import {
  categoryParams,
  readSpendingFilters,
  writeSpendingFilters,
  type SpendingFilters,
} from "./spendingFilters";

const read = (search: string) =>
  readSpendingFilters(new URLSearchParams(search));

const defaults: SpendingFilters = {
  period: "30d",
  months: 12,
  categoryDates: undefined,
  categories: [],
};

describe("readSpendingFilters", () => {
  it("defaults to the API defaults: 30 days, 12 months of trends", () => {
    expect(read("")).toEqual(defaults);
  });

  it("reads every filter", () => {
    expect(
      read(
        "period=90d&months=24&from=2024-09-01&to=2024-09-10&categories=Dining,Groceries",
      ),
    ).toEqual({
      period: "90d",
      months: 24,
      categoryDates: { startDate: "2024-09-01", endDate: "2024-09-10" },
      categories: ["Dining", "Groceries"],
    });
  });

  it.each([
    ["period=2w", { period: "30d" }],
    ["months=25", { months: 12 }],
    ["months=5", { months: 12 }],
    ["from=2024-09-10&to=2024-09-01", { categoryDates: undefined }],
    ["from=yesterday&to=2024-09-01", { categoryDates: undefined }],
    ["from=2024-09-01", { categoryDates: undefined }],
  ])("falls back to the default for %s", (search, expected) => {
    expect(read(search)).toMatchObject(expected);
  });
});

describe("writeSpendingFilters", () => {
  it("leaves defaults out of the URL", () => {
    expect(writeSpendingFilters(defaults).toString()).toBe("");
  });

  it("round-trips through read", () => {
    const filters: SpendingFilters = {
      period: "7d",
      months: 3,
      categoryDates: { startDate: "2024-09-01", endDate: "2024-09-10" },
      categories: ["Dining"],
    };

    expect(readSpendingFilters(writeSpendingFilters(filters))).toEqual(filters);
  });
});

describe("categoryParams", () => {
  it("sends the period, or custom dates when set", () => {
    expect(categoryParams({ period: "7d" })).toEqual({ period: "7d" });
    expect(
      categoryParams({
        period: "7d",
        categoryDates: { startDate: "2024-09-01", endDate: "2024-09-10" },
      }),
    ).toEqual({ startDate: "2024-09-01", endDate: "2024-09-10" });
  });
});
