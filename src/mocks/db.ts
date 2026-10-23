import type { Transaction } from "../api/schemas";
import { findUser, MOCK_USERS, type StoredGoal } from "./fixtures";
import { generateTransactions } from "./generateTransactions";

// In-memory "database" behind the mock API, one store per customer.
// Transactions are generated from a fixed seed; goals are writable and saved
// to localStorage so changes survive a page refresh in the deployed demo.

const storageKey = (customerId: string) =>
  `moya-mock-db:v2:${customerId}:goals`;

type CustomerState = {
  transactions: Transaction[];
  goals: StoredGoal[];
  nextGoalNumber: number;
};

let clock: () => Date = () => new Date();
let stores = new Map<string, CustomerState>();
let freshStart = false;

function readStoredGoals(customerId: string): StoredGoal[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(customerId));
    return raw ? (JSON.parse(raw) as StoredGoal[]) : null;
  } catch {
    return null;
  }
}

function persistGoals(customerId: string, goals: StoredGoal[]) {
  try {
    window.localStorage.setItem(storageKey(customerId), JSON.stringify(goals));
  } catch {
    // Storage can be unavailable (private mode, quota); the session still works.
  }
}

function nextNumberAfter(goals: StoredGoal[]) {
  const numbers = goals.map((goal) => Number(goal.id.replace(/\D/g, "")) || 0);
  return Math.max(0, ...numbers) + 1;
}

function createState(customerId: string): CustomerState {
  const user = findUser(customerId);
  const seedGoals = structuredClone(user?.goals ?? []);
  const goals = (!freshStart && readStoredGoals(customerId)) || seedGoals;
  if (freshStart) persistGoals(customerId, goals);

  return {
    transactions:
      user?.scenario === "active" ? generateTransactions(clock()) : [],
    goals,
    nextGoalNumber: nextNumberAfter(goals),
  };
}

type ResetOptions = {
  /** Fixed clock for deterministic tests. Defaults to the real time. */
  now?: Date;
  /** Ignore and overwrite anything saved in localStorage. */
  fresh?: boolean;
};

export function resetDb({ now, fresh = false }: ResetOptions = {}) {
  clock = now ? () => new Date(now) : () => new Date();
  freshStart = fresh;
  stores = new Map();
  if (fresh) {
    for (const user of MOCK_USERS)
      stores.set(user.customerId, createState(user.customerId));
  }
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
      persistGoals(customerId, current.goals);
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
      persistGoals(customerId, current.goals);
      return updated;
    },

    deleteGoal(id: string) {
      const current = state();
      const before = current.goals.length;
      current.goals = current.goals.filter((goal) => goal.id !== id);
      persistGoals(customerId, current.goals);
      return current.goals.length < before;
    },
  };
}

export type CustomerDb = ReturnType<typeof customerDb>;

export const now = () => clock();
