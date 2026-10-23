import { describe, expect, it } from "vitest";
import {
  pageCount,
  readTransactionsView,
  toTransactionFilters,
  writeTransactionsView,
  type TransactionsView,
} from "./transactionFilters";

const read = (search: string) =>
  readTransactionsView(new URLSearchParams(search));

const defaults: TransactionsView = {
  category: undefined,
  dates: undefined,
  sortBy: "date_desc",
  page: 1,
  pageSize: 20,
};

describe("readTransactionsView", () => {
  it("defaults to the API defaults: newest first, 20 per page", () => {
    expect(read("")).toEqual(defaults);
  });

  it("reads every filter", () => {
    expect(
      read(
        "category=Dining&from=2024-09-01&to=2024-09-10&sortBy=amount_desc&page=3&size=50",
      ),
    ).toEqual({
      category: "Dining",
      dates: { startDate: "2024-09-01", endDate: "2024-09-10" },
      sortBy: "amount_desc",
      page: 3,
      pageSize: 50,
    });
  });

  it.each([
    ["sortBy=merchant", { sortBy: "date_desc" }],
    ["page=0", { page: 1 }],
    ["page=abc", { page: 1 }],
    ["size=100", { pageSize: 20 }],
    ["from=2024-09-10&to=2024-09-01", { dates: undefined }],
    ["category=", { category: undefined }],
  ])("falls back to the default for %s", (search, expected) => {
    expect(read(search)).toMatchObject(expected);
  });
});

describe("writeTransactionsView", () => {
  it("leaves defaults out of the URL", () => {
    expect(writeTransactionsView(defaults).toString()).toBe("");
  });

  it("round-trips through read", () => {
    const view: TransactionsView = {
      category: "Dining",
      dates: { startDate: "2024-09-01", endDate: "2024-09-10" },
      sortBy: "amount_asc",
      page: 2,
      pageSize: 10,
    };

    expect(readTransactionsView(writeTransactionsView(view))).toEqual(view);
  });
});

describe("toTransactionFilters", () => {
  it("maps the view onto the /transactions parameters", () => {
    expect(
      toTransactionFilters({
        category: "Dining",
        dates: { startDate: "2024-09-01", endDate: "2024-09-10" },
        sortBy: "amount_desc",
        page: 3,
        pageSize: 20,
      }),
    ).toEqual({
      limit: 20,
      offset: 40,
      sortBy: "amount_desc",
      category: "Dining",
      startDate: "2024-09-01",
      endDate: "2024-09-10",
    });
  });
});

describe("pageCount", () => {
  it("rounds up and is never below 1", () => {
    expect(pageCount(41, 20)).toBe(3);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(0, 20)).toBe(1);
  });
});
