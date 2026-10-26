import { describe, expect, it } from "vitest";
import {
  currencySymbol,
  firstName,
  formatAxisCurrency,
  formatChange,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDayLong,
  formatMonthLong,
  formatMonthShort,
  formatPercent,
} from "./format";

describe("format", () => {
  it.each([
    [16842.5, "R16,842.50"],
    [0, "R0.00"],
    [-99, "-R99.00"],
  ])("formats %d rand as %s", (amount, expected) => {
    expect(formatCurrency(amount)).toBe(expected);
  });

  it("formats other currencies with their own symbol", () => {
    expect(formatCurrency(10, "USD")).toBe("$10.00");
  });

  it("formats axis labels without decimals", () => {
    expect(formatAxisCurrency(12000)).toBe("R12,000");
    expect(formatAxisCurrency(12000, "USD")).toBe("$12,000");
  });

  it.each([
    ["ZAR", "R"],
    ["USD", "$"],
    ["EUR", "€"],
  ])("uses %s for the symbol %s", (currency, symbol) => {
    expect(currencySymbol(currency)).toBe(symbol);
  });

  it.each([
    [12.4, "+12.4%"],
    [-3.2, "-3.2%"],
    [0, "0.0%"],
  ])("formats a %d change as %s", (value, expected) => {
    expect(formatChange(value)).toBe(expected);
  });

  it("formats percentages and months", () => {
    expect(formatPercent(34.21)).toBe("34.2%");
    expect(formatMonthShort("2024-05")).toBe("May");
    expect(formatMonthLong("2024-05")).toBe("May 2024");
  });

  it("derives first names", () => {
    expect(firstName("  John Doe ")).toBe("John");
  });
});

describe("day formats", () => {
  it("writes September as Sep everywhere", () => {
    expect(formatDayLong("2024-09-23")).toBe("23 Sep 2024");
    expect(formatDate("2024-09-23T12:00:00Z")).toBe("23 Sep 2024");
    expect(formatDateTime("2024-09-23T12:00:00Z")).toMatch(
      /^23 Sep 2024, \d{2}:\d{2}$/,
    );
  });
});
