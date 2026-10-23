import { describe, expect, it } from "vitest";
import { parseBudget } from "./goalSchema";

describe("parseBudget", () => {
  it.each([
    ["1500", 1500],
    ["1500.5", 1500.5],
    ["1500.50", 1500.5],
    ["R 1,500.50", 1500.5],
    [" 250 ", 250],
  ])("reads %j as R%d", (input, amount) => {
    expect(parseBudget(input)).toEqual({ amount });
  });

  it.each([
    ["", "goals.form.errors.budgetRequired"],
    ["R", "goals.form.errors.budgetRequired"],
    ["abc", "goals.form.errors.budgetInvalid"],
    ["12.345", "goals.form.errors.budgetInvalid"],
    ["-5", "goals.form.errors.budgetInvalid"],
    ["0", "goals.form.errors.budgetPositive"],
    ["1000000.01", "goals.form.errors.budgetTooHigh"],
  ])("rejects %j", (input, error) => {
    expect(parseBudget(input)).toEqual({ error });
  });
});
