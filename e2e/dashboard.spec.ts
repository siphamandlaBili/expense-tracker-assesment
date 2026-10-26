import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./fixtures.ts";

// Demo customers served by the API (github.com/siphamandlaBili/expense-tracker-data).
const USERS = {
  active: { accountNumber: "12345678901234", pin: "12345", firstName: "John" },
  empty: { accountNumber: "23456789012345", pin: "23456", firstName: "Thandi" },
  error: { accountNumber: "34567890123456", pin: "34567", firstName: "Pieter" },
};

async function signIn(page: Page, user: (typeof USERS)[keyof typeof USERS]) {
  await openApp(page);
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in" });
  await dialog.getByLabel("Account number").fill(user.accountNumber);
  await dialog.getByLabel("PIN", { exact: true }).fill(user.pin);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: new RegExp(user.firstName) }),
  ).toBeVisible();
}

test("customer with data sees their overview", async ({ page }) => {
  await signIn(page, USERS.active);

  await expect(page).toHaveURL(/\/dashboard$/);
  const recent = page.getByRole("region", { name: "Recent transactions" });
  await expect(recent.getByRole("row")).toHaveCount(5);
  await expect(
    page
      .getByRole("region", { name: "Monthly spending trend" })
      .locator(".recharts-area-curve"),
  ).toBeVisible();
});

test("overview has no accessibility violations", async ({ page }) => {
  await signIn(page, USERS.active);
  await expect(
    page.getByRole("region", { name: "Recent transactions" }).getByRole("row"),
  ).toHaveCount(5);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("new customer sees empty states", async ({ page }) => {
  await signIn(page, USERS.empty);

  await expect(page.getByText(/no spending to chart yet/i)).toBeVisible();
  await expect(page.getByText(/nothing to break down yet/i)).toBeVisible();
  await expect(page.getByText(/no transactions yet/i)).toBeVisible();
});

test("failing service shows error states with retry", async ({ page }) => {
  await signIn(page, USERS.error);

  // The app retries 5xx twice with backoff before showing the error.
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(4, {
    timeout: 15_000,
  });
});

test("wrong PIN is rejected", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in" });
  await dialog.getByLabel("Account number").fill(USERS.active.accountNumber);
  await dialog.getByLabel("PIN", { exact: true }).fill("99999");
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(dialog.getByRole("alert")).toHaveText(
    /incorrect account number or pin/i,
  );
});

test("signing out returns to the landing page and protects the dashboard", async ({
  page,
  isMobile,
}) => {
  await signIn(page, USERS.active);

  // Phones sign out from the account menu; wider screens from the sidebar.
  if (isMobile) {
    await page.getByRole("button", { name: "Signed in as John Doe" }).click();
  }
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /understand your spending/i }),
  ).toBeVisible();

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { level: 1, name: /understand your spending/i }),
  ).toBeVisible();
});

test("transactions table fits without scrolling sideways", async ({ page }) => {
  await signIn(page, USERS.active);
  const table = page
    .getByRole("region", { name: "Recent transactions" })
    .getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(5);

  const overflow = await table.evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("clicking a transaction opens its details drawer", async ({
  page,
  isMobile,
}) => {
  await signIn(page, USERS.active);
  const rows = page
    .getByRole("region", { name: "Recent transactions" })
    .getByRole("row");
  await expect(rows).toHaveCount(5);

  await rows.nth(1).getByRole("cell").last().click();
  const drawer = page.getByRole("dialog", { name: "Transaction details" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(/^txn_/)).toBeVisible();

  // The bottom sheet (phones) closes by swiping or tapping outside, so its ✕
  // is visually hidden (still there for screen readers).
  const closeWidth = await drawer
    .getByRole("button", { name: "Close transaction details" })
    .evaluate((element) => element.getBoundingClientRect().width);
  if (isMobile) expect(closeWidth).toBeLessThanOrEqual(1);
  else expect(closeWidth).toBeGreaterThan(20);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("opening the drawer doesn't move the page behind it", async ({ page }) => {
  await signIn(page, USERS.active);
  const rows = page
    .getByRole("region", { name: "Recent transactions" })
    .getByRole("row");
  await expect(rows).toHaveCount(5);
  // Scroll first: Playwright scrolls a target into view before clicking it,
  // which would otherwise count as the page "moving".
  const row = rows.nth(1);
  await row.scrollIntoViewIfNeeded();
  const before = await row.boundingBox();

  await rows.nth(1).getByRole("cell").last().click();
  await expect(
    page.getByRole("dialog", { name: "Transaction details" }),
  ).toBeVisible();

  expect(await row.boundingBox()).toEqual(before);
});

test("bottom sheet fits its content and can be dragged", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "The bottom sheet is the phone layout");
  await signIn(page, USERS.active);
  const rows = page
    .getByRole("region", { name: "Recent transactions" })
    .getByRole("row");
  await expect(rows).toHaveCount(5);
  await rows.nth(1).getByRole("cell").last().click();

  const sheet = page.getByRole("dialog", { name: "Transaction details" });
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(400); // let it settle at its snap point

  // Smallest snap point shows everything: nothing left to scroll.
  await expect(sheet.getByText(/^txn_/)).toBeInViewport();
  const scroller = sheet.locator(".overflow-y-auto");
  const overflow = await scroller.evaluate(
    (element) => element.scrollHeight - element.clientHeight,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const title = sheet.getByRole("heading", { name: "Transaction details" });
  const drag = async (byY: number) => {
    const box = (await title.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + box.height / 2 + byY, {
      steps: 12,
    });
    await page.mouse.up();
    await page.waitForTimeout(400);
  };

  // Drag up: grows to the tall snap point.
  const smallHeight = (await sheet.boundingBox())!.height;
  await drag(-250);
  expect((await sheet.boundingBox())!.height).toBeGreaterThan(smallHeight + 50);

  // Drag well down: dismisses.
  await drag(700);
  await expect(sheet).toBeHidden();
});

test("profile page shows the customer's details", async ({ page }) => {
  await signIn(page, USERS.active);
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .getByRole("link", { name: "Profile" })
    .click();

  const card = page.getByRole("region", { name: "Account details" });
  await expect(card.getByText("john.doe@email.com")).toBeVisible();
  await expect(card.getByText("South African Rand (ZAR)")).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("goals page opens a goal's details in the drawer", async ({ page }) => {
  await signIn(page, USERS.active);
  await page.getByRole("link", { name: "Goals" }).click();

  // Goals live in the shared database and visitors can change them, so open
  // whichever goal is listed first rather than a particular one.
  const card = page.getByRole("article").first();
  await expect(card).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await card.click();
  const drawer = page.getByRole("dialog", { name: "Goal details" });
  await expect(
    drawer.getByRole("button", { name: "Edit budget" }),
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Delete goal" }),
  ).toBeVisible();
});

test("phones navigate with a bottom bar that never covers the page", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "The bottom bar is the phone layout");
  await signIn(page, USERS.active);

  await expect(page.getByRole("complementary")).toHaveCount(0);
  const bar = page.getByRole("navigation", { name: "Dashboard" });
  const viewport = page.viewportSize()!;
  const barBox = (await bar.boundingBox())!;
  expect(barBox.y + barBox.height).toBeCloseTo(viewport.height, 0);

  // The active page is primary blue, icon and label alike.
  const goals = bar.getByRole("link", { name: "Goals" });
  await goals.click();
  await expect(goals).toHaveAttribute("aria-current", "page");
  await expect(goals).toHaveCSS("color", "rgb(0, 51, 160)");
  await expect(goals.locator("svg")).toHaveCSS("color", "rgb(0, 51, 160)");
  await expect(bar.getByRole("link", { name: "Overview" })).not.toHaveCSS(
    "color",
    "rgb(0, 51, 160)",
  );

  // Scrolled to the end, the last of the content sits above the bar.
  await page.getByRole("link", { name: "Overview" }).click();
  await expect(
    page.getByRole("region", { name: "Recent transactions" }).getByRole("row"),
  ).toHaveCount(5);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const lastCard = page.locator("main section").last();
  const cardBox = (await lastCard.boundingBox())!;
  const barTop = (await bar.boundingBox())!.y;
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(barTop);
});

test("tablets and up navigate with the sidebar", async ({ page, isMobile }) => {
  test.skip(isMobile, "The sidebar is the tablet and desktop layout");
  await page.setViewportSize({ width: 800, height: 1000 });
  await signIn(page, USERS.active);

  const nav = page.getByRole("navigation", { name: "Dashboard" });
  await expect(nav).toHaveCount(1);
  // The one navigation is the sidebar, with no bottom bar.
  await expect(
    page.getByRole("complementary").getByRole("navigation"),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary").getByRole("link", { name: "Overview" }),
  ).toHaveAttribute("aria-current", "page");
});
