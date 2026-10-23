import { expect, test } from "@playwright/test";
import { openApp } from "./fixtures.ts";

// The production build serves the API from the in-browser mock when
// VITE_ENABLE_MOCKS=true, so the deployed demo works without a backend.

test("the mock API answers from the production build", async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(async () => {
    const profile = await fetch("/api/customers/12345/profile");
    const goal = await fetch("/api/customers/12345/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Dining", monthlyBudget: 800 }),
    });
    const goals = await fetch("/api/customers/12345/goals");
    return {
      profileStatus: profile.status,
      profile: await profile.json(),
      goalStatus: goal.status,
      goals: (await goals.json()) as { goals: unknown[] },
    };
  });

  expect(result.profileStatus).toBe(200);
  expect(result.profile).toMatchObject({
    customerId: "12345",
    currency: "ZAR",
  });
  expect(result.goalStatus).toBe(201);
  expect(result.goals.goals).toHaveLength(3);
});

test("goal changes survive a page reload", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() =>
    fetch("/api/customers/12345/goals/goal_001", { method: "DELETE" }),
  );

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const goals = await page.evaluate(async () => {
    const response = await fetch("/api/customers/12345/goals");
    const body = (await response.json()) as { goals: { id: string }[] };
    return body.goals;
  });

  expect(goals.map((goal) => goal.id)).toEqual(["goal_002"]);
});
