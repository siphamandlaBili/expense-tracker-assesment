import { describe, expect, it } from "vitest";
import { transactionSchema } from "../api/schemas";
import { TEST_NOW } from "../test/constants";
import { categoriesFixture } from "./fixtures";
import { generateTransactions } from "./generateTransactions";

describe("generateTransactions", () => {
  const transactions = generateTransactions(TEST_NOW);

  it("is deterministic for the same day", () => {
    const later = new Date(TEST_NOW.getTime() + 60_000);
    expect(generateTransactions(later).slice(1, 50)).toEqual(
      transactions.slice(1, 50),
    );
  });

  it("produces valid transactions in the past, newest first", () => {
    expect(transactions.length).toBeGreaterThan(1000);
    for (const txn of transactions) {
      expect(transactionSchema.safeParse(txn).success).toBe(true);
      expect(new Date(txn.date).getTime()).toBeLessThanOrEqual(
        TEST_NOW.getTime(),
      );
    }
    const dates = transactions.map((t) => t.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("uses every category with its colour and icon", () => {
    for (const category of categoriesFixture) {
      expect(
        transactions.find((t) => t.category === category.name),
      ).toMatchObject({
        categoryColor: category.color,
        icon: category.icon,
      });
    }
  });

  it("gives every transaction a unique id", () => {
    expect(new Set(transactions.map((t) => t.id)).size).toBe(
      transactions.length,
    );
  });
});
