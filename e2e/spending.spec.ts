import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { chooseOption, openApp } from "./fixtures.ts";

async function openSpending(page: Page, isMobile: boolean) {
  await openApp(page);
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in" });
  await dialog.getByLabel("Account number").fill("12345678901234");
  await dialog.getByLabel("PIN", { exact: true }).fill("12345");
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("John");

  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Spending" }).last().click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Spending analysis" }),
  ).toBeVisible();
}

const categoryRows = (page: Page) =>
  page.getByRole("region", { name: "Category breakdown" }).locator("tbody tr");

test("spending page loads, filters by period and category", async ({
  page,
  isMobile,
}) => {
  await openSpending(page, isMobile);
  await expect(categoryRows(page).first()).toBeVisible();

  await page.getByRole("button", { name: "90 days" }).click();
  await expect(page).toHaveURL(/period=90d/);
  await expect(
    page
      .getByRole("region", { name: "Spending summary" })
      .getByText("vs. the previous 90 days"),
  ).toBeVisible();

  await chooseOption(page, "Trend length", "Last 24 months");
  await expect(page).toHaveURL(/months=24/);

  await page
    .getByRole("group", { name: "Show categories" })
    .getByRole("button", { name: "Dining" })
    .click();
  await expect(page).toHaveURL(/categories=Dining/);
  await expect(categoryRows(page)).toHaveCount(1);
});

test("spending tables fit without scrolling sideways", async ({
  page,
  isMobile,
}) => {
  await openSpending(page, isMobile);
  const table = page
    .getByRole("region", { name: "Category breakdown" })
    .getByRole("table");
  await expect(categoryRows(page).first()).toBeVisible();

  const overflow = await table.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(pageOverflow).toBeLessThanOrEqual(0);
});

test("spending page has no accessibility violations", async ({
  page,
  isMobile,
}) => {
  await openSpending(page, isMobile);
  await expect(categoryRows(page).first()).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Monthly spending trend" })
      .locator(".recharts-area-curve"),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
