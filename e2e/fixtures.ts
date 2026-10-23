import { expect, type Page } from "@playwright/test";

/**
 * Opens the app and waits until it has rendered and the mock API answers.
 * The page renders before the mock service worker is running (only the
 * app's own API calls wait for it), so a test calling fetch directly needs
 * the second wait.
 */
export async function openApp(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await waitForMockApi(page);
}

/** Polls until /api is served by the mock (JSON), not the static server. */
export async function waitForMockApi(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/customers/12345/profile");
        return response.headers.get("content-type") ?? "";
      }),
    )
    .toContain("application/json");
}

/** Opens a styled <Select> (role combobox) and clicks the named option. */
export async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
