import { expect, type Page } from "@playwright/test";

/**
 * Opens the app and waits until it has rendered. The app renders only after
 * the mock service worker is running, so API calls made after this are mocked.
 */
export async function openApp(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Opens a styled <Select> (role combobox) and clicks the named option. */
export async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
