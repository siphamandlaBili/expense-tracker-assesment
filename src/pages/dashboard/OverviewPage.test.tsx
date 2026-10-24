import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeApi, http } from "../../test/fakeApi";
import App from "../../App";
import { customersApi } from "../../api/customers";
import { formatCurrency } from "../../lib/format";
import { ACTIVE_USER, ERROR_USER } from "../../test/fakeApi/fixtures";
import { expectNoA11yViolations } from "../../test/axe";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

function renderOverview(session: (typeof sessions)[keyof typeof sessions]) {
  return renderWithProviders(<App />, { route: "/dashboard", session });
}

const panel = (name: RegExp) => screen.getByRole("region", { name });

/** Last cell of a transaction row, away from the merchant button. */
const amountCell = (row: HTMLElement) =>
  within(row).getAllByRole("cell").at(-1) as HTMLElement;

describe("Overview: customer with data", () => {
  it("greets the customer and shows their account type", async () => {
    renderOverview(sessions.active);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /good (morning|afternoon|evening), john/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Premium Account")).toBeInTheDocument();
  });

  it("shows the 30-day summary figures from the API", async () => {
    const summary = await customersApi.getSpendingSummary(
      ACTIVE_USER.customerId,
      "30d",
    );
    renderOverview(sessions.active);
    const stats = panel(/at a glance/i);

    expect(
      await within(stats).findByText(formatCurrency(summary.totalSpent)),
    ).toBeInTheDocument();
    expect(
      within(stats).getByText(String(summary.transactionCount)),
    ).toBeInTheDocument();
    expect(
      within(stats).getByText(formatCurrency(summary.averageTransaction)),
    ).toBeInTheDocument();
  });

  it("shows the same 30-day total in the stats and the category chart", async () => {
    const summary = await customersApi.getSpendingSummary(
      ACTIVE_USER.customerId,
      "30d",
    );
    const total = formatCurrency(summary.totalSpent);
    renderOverview(sessions.active);

    expect(
      await within(panel(/at a glance/i)).findByText(total),
    ).toBeInTheDocument();
    expect(
      await within(panel(/spending by category/i)).findByText(total),
    ).toBeInTheDocument();
  });

  it("lists spending per category with share and amount", async () => {
    const { categories } = await customersApi.getSpendingByCategory(
      ACTIVE_USER.customerId,
      { period: "30d" },
    );
    renderOverview(sessions.active);

    const categoryPanel = panel(/spending by category/i);
    const rows = await within(categoryPanel).findAllByRole("row");
    // Header row plus one per category.
    expect(rows).toHaveLength(categories.length + 1);
    expect(
      within(categoryPanel).getByRole("rowheader", {
        name: categories[0].name,
      }),
    ).toBeInTheDocument();
  });

  it("shows the four most recent transactions and a link to all", async () => {
    const { transactions } = await customersApi.getTransactions(
      ACTIVE_USER.customerId,
      { limit: 4 },
    );
    renderOverview(sessions.active);

    const recentPanel = panel(/recent transactions/i);
    const rows = await within(recentPanel).findAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(within(rows[1]).getByText(transactions[0].merchant)).toBeVisible();
    expect(
      within(recentPanel).getByRole("link", { name: /view all/i }),
    ).toHaveAttribute("href", "/dashboard/transactions");
  });

  it("opens a drawer with every detail of a transaction", async () => {
    const [latest] = (
      await customersApi.getTransactions(ACTIVE_USER.customerId, { limit: 1 })
    ).transactions;
    const { user } = renderOverview(sessions.active);
    const recentPanel = panel(/recent transactions/i);

    const trigger = await within(recentPanel).findByRole("button", {
      name: `${latest.merchant}, view details`,
    });
    await user.click(trigger);

    const drawer = screen.getByRole("dialog", { name: "Transaction details" });
    expect(within(drawer).getByText(latest.merchant)).toBeInTheDocument();
    expect(within(drawer).getByText(latest.description)).toBeInTheDocument();
    expect(within(drawer).getByText(latest.paymentMethod)).toBeInTheDocument();
    expect(within(drawer).getByText(latest.id)).toBeInTheDocument();
    expect(
      within(drawer).getByText(formatCurrency(latest.amount)),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", {
        name: /close transaction details/i,
      }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens the drawer by clicking anywhere on a row and closes it from the backdrop", async () => {
    const { user } = renderOverview(sessions.active);
    const rows = await within(panel(/recent transactions/i)).findAllByRole(
      "row",
    );

    // Click the amount cell, not the merchant button.
    await user.click(amountCell(rows[1]));
    expect(
      screen.getByRole("dialog", { name: "Transaction details" }),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("transaction-drawer-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(amountCell(rows[2]));
    await user.click(
      screen.getByRole("button", { name: /close transaction details/i }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("slides the drawer out before removing it when motion is allowed", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { user } = renderOverview(sessions.active);
    const rows = await within(panel(/recent transactions/i)).findAllByRole(
      "row",
    );
    await user.click(amountCell(rows[1]));
    const drawer = screen.getByRole("dialog", { name: "Transaction details" });

    await user.keyboard("{Escape}");

    // Still on screen, playing the exit animation...
    expect(drawer).toHaveClass("animate-sheet-out");
    // ...then removed once it finishes.
    await waitForElementToBeRemoved(drawer);
  });

  it("has no detectable accessibility violations with the drawer open", async () => {
    const { user } = renderOverview(sessions.active);
    const rows = await within(panel(/recent transactions/i)).findAllByRole(
      "row",
    );
    await user.click(amountCell(rows[1]));

    await expectNoA11yViolations(
      screen.getByRole("dialog", { name: "Transaction details" }),
    );
  });

  it("labels what each card covers", () => {
    renderOverview(sessions.active);

    expect(
      within(panel(/spending by category/i)).getByText("Last 30 days"),
    ).toBeInTheDocument();
    expect(
      within(panel(/recent transactions/i)).getByText("Last 4 transactions"),
    ).toBeInTheDocument();
  });

  it("charts the last three months", async () => {
    renderOverview(sessions.active);

    const trendPanel = panel(/monthly spending trend/i);
    expect(within(trendPanel).getByText("Last 3 months")).toBeInTheDocument();
    // Month rows in the screen-reader table, minus its header row.
    const rows = await within(trendPanel).findAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(within(trendPanel).queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations once loaded", async () => {
    const { container } = renderOverview(sessions.active);
    await within(panel(/recent transactions/i)).findAllByRole("row");

    await expectNoA11yViolations(container);
  });
});

describe("Overview: new customer with no transactions", () => {
  it("shows empty states instead of charts and tables", async () => {
    renderOverview(sessions.empty);

    expect(
      await screen.findByText(/no spending to chart yet/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/nothing to break down yet/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/no transactions yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view all/i }),
    ).not.toBeInTheDocument();
    expect(
      await within(panel(/at a glance/i)).findAllByText("R0.00"),
    ).toHaveLength(2);
  });
});

describe("Overview: spending service failing", () => {
  it("shows an error state with a retry in every data panel", async () => {
    renderOverview(sessions.error);

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(4));
    expect(screen.getAllByRole("button", { name: /try again/i })).toHaveLength(
      4,
    );
    // The profile still loads, so the page greets the customer.
    expect(
      screen.getByRole("heading", { level: 1, name: /pieter/i }),
    ).toBeInTheDocument();
  });

  it("recovers when a retry succeeds", async () => {
    const { user } = renderOverview(sessions.error);
    const recentPanel = panel(/recent transactions/i);
    const retry = await within(recentPanel).findByRole("button", {
      name: /try again/i,
    });

    fakeApi.use(
      http.get(`*/customers/${ERROR_USER.customerId}/transactions`, () =>
        Response.json({
          transactions: [],
          pagination: { total: 0, limit: 4, offset: 0, hasMore: false },
        }),
      ),
    );
    await user.click(retry);

    expect(
      await within(recentPanel).findByText(/no transactions yet/i),
    ).toBeInTheDocument();
  });
});
