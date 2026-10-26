import type { Transaction } from "../../api/schemas";
import { findUser, type StoredGoal } from "./fixtures";
import { generateTransactions } from "./generateTransactions";

// In-memory "database" behind the fake API, one store per customer.
// Transactions are generated from a fixed seed; goals are writable. Reset
// before every test (src/test/setup.ts).

type CustomerState = {
  transactions: Transaction[];
  goals: StoredGoal[];
  nextGoalNumber: number;
};

let clock: () => Date = () => new Date();
let stores = new Map<string, CustomerState>();

function createState(customerId: string): CustomerState {
  const user = findUser(customerId);
  const goals = structuredClone(user?.goals ?? []);
  return {
    transactions:
      user?.scenario === "active" ? generateTransactions(clock()) : [],
    goals,
    nextGoalNumber: goals.length + 1,
  };
}

/** Empties every store and fixes the clock, so data is identical each run. */
export function resetDb({ now }: { now: Date }) {
  clock = () => new Date(now);
  stores = new Map();
}

/** Store for one customer, created on first use. */
export function customerDb(customerId: string) {
  const state = () => {
    let existing = stores.get(customerId);
    if (!existing) {
      existing = createState(customerId);
      stores.set(customerId, existing);
    }
    return existing;
  };

  return {
    transactions: () => state().transactions,
    goals: () => state().goals,

    createGoal(input: Omit<StoredGoal, "id">): StoredGoal {
      const current = state();
      const goal = {
        id: `goal_${String(current.nextGoalNumber).padStart(3, "0")}`,
        ...input,
      };
      current.nextGoalNumber += 1;
      current.goals = [...current.goals, goal];
      return goal;
    },

    updateGoal(id: string, changes: Pick<StoredGoal, "monthlyBudget">) {
      const current = state();
      const existing = current.goals.find((goal) => goal.id === id);
      if (!existing) return null;

      const updated = { ...existing, ...changes };
      current.goals = current.goals.map((goal) =>
        goal.id === id ? updated : goal,
      );
      return updated;
    },

    deleteGoal(id: string) {
      const current = state();
      const before = current.goals.length;
      current.goals = current.goals.filter((goal) => goal.id !== id);
      return current.goals.length < before;
    },
  };
}

export type CustomerDb = ReturnType<typeof customerDb>;

export const now = () => clock();
