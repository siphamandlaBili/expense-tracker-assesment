import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./fixtures.ts";

const PRIMARY_RGB = "rgb(0, 51, 160)"; // #0033a0

async function openSignIn(page: Page) {
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  const dialog = page.getByRole("dialog", { name: "Sign in" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("opens with an empty, focused form", async ({ page }) => {
  await openSignIn(page);

  await expect(page.getByLabel("Account number")).toBeFocused();
  await expect(page.getByLabel("PIN", { exact: true })).toHaveValue("");
});

test("shows a primary-coloured outline on the focused field", async ({
  page,
}) => {
  await openSignIn(page);

  const account = page.getByLabel("Account number");
  await expect(account).toHaveCSS("border-color", PRIMARY_RGB);
  await expect(account).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("blocks invalid details and accepts valid ones", async ({ page }) => {
  const dialog = await openSignIn(page);
  const submit = dialog.getByRole("button", { name: "Sign in", exact: true });

  await page.getByLabel("Account number").fill("1234");
  await submit.click();
  await expect(
    page.getByText("Account number must be exactly 14 digits."),
  ).toBeVisible();
  await expect(page.getByText("Please enter your PIN.")).toBeVisible();

  await page.getByLabel("Account number").fill("12345678901234");
  await page.getByLabel("PIN", { exact: true }).fill("12345");
  await submit.click();
  await expect(dialog).toBeHidden();
});

test("locks page scroll while open and restores it on close", async ({
  page,
}) => {
  await openSignIn(page);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("can be opened from the menu on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu sign in entry is only shown on small screens");

  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Menu" })
    .getByRole("button", { name: "Sign in" })
    .click();

  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
});
