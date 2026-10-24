import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeApi } from "../../test/fakeApi";
import App from "../../App";
import { customersApi } from "../../api/customers";
import { formatCurrency } from "../../lib/format";
import { ACTIVE_USER } from "../../test/fakeApi/fixtures";
import { expectNoA11yViolations } from "../../test/axe";
import {
  chooseOption,
  endDialog,
  pickDateRange,
  startDialog,
} from "../../test/interactions";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

const id = ACTIVE_USER.customerId;

/** Records the query string of every request to the /spending endpoints. */
function recordRequests() {
  const requests: { endpoint: string; params: Record<string, string> }[] = [];
  fakeApi.onRequest((request) => {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/spending\/(\w+)$/);
    if (match) {
      requests.push({
        endpoint: match[1],
        params: Object.fromEntries(url.searchParams),
      });
    }
  });
  return requests;
}

function renderSpending(
  session: (typeof sessions)[keyof typeof sessions] = sessions.active,
  search = "",
) {
  return renderWithProviders(<App />, {
    route: `/dashboard/spending${search}`,
    session,
  });
}

const panel = (name: RegExp) => screen.getByRole("region", { name });
const periodButton = (name: string) =>
  within(screen.getByRole("group", { name: "Time period" })).getByRole(
    "button",
    { name },
  );
/** Months in the trend chart's screen-reader table (minus its header row). */
const trendMonths = async () =>
  (await within(panel(/monthly spending trend/i)).findAllByRole("row")).length -
  1;
const categoryRows = async () =>
  (await within(panel(/category breakdown/i)).findAllByRole("row")).slice(1);
const dateFields = () =>
  within(panel(/category breakdown/i)).getByRole("group", {
    name: "Category breakdown dates",
  });

describe("Spending page", () => {
  it("loads each card with its endpoint's default filters", async () => {
    const summary = await customersApi.getSpendingSummary(id, "30d");
    const requests = recordRequests();
    renderSpending();

    expect(
      screen.getByRole("heading", { level: 1, name: "Spending analysis" }),
    ).toBeInTheDocument();
    expect(periodButton("30 days")).toHaveAttribute("aria-pressed", "true");
    expect(
      await within(panel(/spending summary/i)).findByText(
        formatCurrency(summary.totalSpent),
      ),
    ).toBeInTheDocument();
    await waitFor(async () => expect(await trendMonths()).toBe(12));
    await categoryRows();

    expect(requests).toEqual(
      expect.arrayContaining([
        { endpoint: "summary", params: { period: "30d" } },
        { endpoint: "trends", params: { months: "12" } },
        { endpoint: "categories", params: { period: "30d" } },
      ]),
    );
  });

  it("applies the period to the summary and categories, not the trend", async () => {
    const summary = await customersApi.getSpendingSummary(id, "90d");
    const requests = recordRequests();
    const { user } = renderSpending();
    await waitFor(async () => expect(await trendMonths()).toBe(12));

    await user.click(periodButton("90 days"));

    expect(periodButton("90 days")).toHaveAttribute("aria-pressed", "true");
    expect(
      await within(panel(/spending summary/i)).findByText(
        formatCurrency(summary.totalSpent),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("vs. the previous 90 days")).toBeInTheDocument();
    await waitFor(() =>
      expect(requests).toContainEqual({
        endpoint: "categories",
        params: { period: "90d" },
      }),
    );
    // The trend has no period filter, so it isn't requested again.
    expect(requests.filter((r) => r.endpoint === "trends")).toHaveLength(1);
  });

  it("changes the trend length with its own picker", async () => {
    const { user } = renderSpending();
    await waitFor(async () => expect(await trendMonths()).toBe(12));

    await chooseOption(
      user,
      within(panel(/monthly spending trend/i)).getByRole("combobox", {
        name: "Trend length",
      }),
      "Last 24 months",
    );

    await waitFor(async () => expect(await trendMonths()).toBe(24));
  });

  it("reads the filters from the URL", async () => {
    renderSpending(sessions.active, "?period=1y&months=6");

    expect(periodButton("1 year")).toHaveAttribute("aria-pressed", "true");
    expect(
      within(panel(/monthly spending trend/i)).getByRole("combobox", {
        name: "Trend length",
      }),
    ).toHaveTextContent("Last 6 months");
    await waitFor(async () => expect(await trendMonths()).toBe(6));
  });

  it("applies custom dates to the category breakdown only", async () => {
    const requests = recordRequests();
    const { user } = renderSpending();
    await categoryRows();

    // Separate From and To fields, showing the period's dates to begin with.
    expect(
      within(dateFields()).getByRole("button", { name: /^From: / }),
    ).toBeInTheDocument();
    await user.click(
      within(dateFields()).getByRole("button", { name: /^To: / }),
    );
    expect(endDialog()).toHaveAccessibleDescription(
      "Applies to the category breakdown only.",
    );
    await user.keyboard("{Escape}");

    await pickDateRange(user, dateFields(), "2024-09-01", "2024-09-10");

    expect(
      within(dateFields()).getByRole("button", { name: "From: 1 Sep 2024" }),
    ).toBeInTheDocument();
    expect(
      within(dateFields()).getByRole("button", { name: "To: 10 Sep 2024" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(requests).toContainEqual({
        endpoint: "categories",
        params: { startDate: "2024-09-01", endDate: "2024-09-10" },
      }),
    );
    // The summary has no date filter: it stays on the page's period.
    expect(periodButton("30 days")).toHaveAttribute("aria-pressed", "true");
    expect(
      requests
        .filter((r) => r.endpoint === "summary")
        .every((r) => r.params.period === "30d"),
    ).toBe(true);
  });

  it("choosing a period replaces the category card's custom dates", async () => {
    const requests = recordRequests();
    const { user } = renderSpending(
      sessions.active,
      "?from=2024-09-01&to=2024-09-10",
    );
    expect(
      within(dateFields()).getByRole("button", { name: "From: 1 Sep 2024" }),
    ).toBeInTheDocument();

    await user.click(periodButton("7 days"));

    // The card follows the period again, showing its dates.
    await waitFor(() =>
      expect(requests).toContainEqual({
        endpoint: "categories",
        params: { period: "7d" },
      }),
    );
    expect(
      await within(dateFields()).findByRole("button", {
        name: "From: 10 Sep 2024",
      }),
    ).toBeInTheDocument();
    expect(
      within(dateFields()).getByRole("button", { name: "To: 16 Sep 2024" }),
    ).toBeInTheDocument();
  });

  it("keeps From on or before To, and To on or after From", async () => {
    const { user } = renderSpending(
      sessions.active,
      "?from=2024-09-05&to=2024-09-10",
    );

    await user.click(
      within(dateFields()).getByRole("button", { name: "From: 5 Sep 2024" }),
    );
    expect(
      within(startDialog()).getByRole("button", { name: "11 Sep 2024" }),
    ).toBeDisabled();
    expect(
      within(startDialog()).getByRole("button", { name: "10 Sep 2024" }),
    ).toBeEnabled();

    await user.click(
      within(dateFields()).getByRole("button", { name: "To: 10 Sep 2024" }),
    );
    expect(
      within(endDialog()).getByRole("button", { name: "4 Sep 2024" }),
    ).toBeDisabled();
    expect(
      within(endDialog()).getByRole("button", { name: "5 Sep 2024" }),
    ).toBeEnabled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters categories for display without a new request", async () => {
    const { categories } = await customersApi.getSpendingByCategory(id, {
      period: "30d",
    });
    const { user } = renderSpending();
    expect(await categoryRows()).toHaveLength(categories.length);
    const requests = recordRequests();

    const chips = within(
      screen.getByRole("group", { name: "Show categories" }),
    );
    await user.click(chips.getByRole("button", { name: "Dining" }));

    const rows = await categoryRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByRole("rowheader")).toHaveTextContent("Dining");
    expect(
      within(panel(/category breakdown/i)).getByText("Selected total"),
    ).toBeInTheDocument();
    expect(requests).toEqual([]);

    await user.click(chips.getByRole("button", { name: "All" }));
    expect(await categoryRows()).toHaveLength(categories.length);
  });

  it("shows empty states for a customer with no transactions", async () => {
    renderSpending(sessions.empty);

    expect(
      await screen.findByText(/no spending to chart yet/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/nothing to break down/i),
    ).toBeInTheDocument();
    // Total and average are both zero.
    expect(
      await within(panel(/spending summary/i)).findAllByText("R0.00"),
    ).toHaveLength(2);
  });

  it("shows error states when the spending service fails", async () => {
    renderSpending(sessions.error);

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(3));
    expect(screen.getAllByRole("button", { name: /try again/i })).toHaveLength(
      3,
    );
  });

  it("has no detectable accessibility violations once loaded", async () => {
    const { container } = renderSpending();
    await categoryRows();
    await waitFor(async () => expect(await trendMonths()).toBe(12));

    await expectNoA11yViolations(container);
  });
});
