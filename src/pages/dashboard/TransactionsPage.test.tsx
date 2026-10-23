import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../../App";
import { customersApi } from "../../api/customers";
import { formatCount, formatCurrency } from "../../lib/format";
import { ACTIVE_USER } from "../../mocks/fixtures";
import { server } from "../../mocks/server";
import { expectNoA11yViolations } from "../../test/axe";
import {
  chooseOption,
  clickDay,
  endDialog,
  pickDateRange,
  startDialog,
} from "../../test/interactions";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

const id = ACTIVE_USER.customerId;

afterEach(() => {
  server.events.removeAllListeners();
});

/** Records the query params of every /transactions request. */
function recordRequests() {
  const requests: Record<string, string>[] = [];
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/transactions")) {
      requests.push(Object.fromEntries(url.searchParams));
    }
  });
  return requests;
}

function renderTransactions(
  session: (typeof sessions)[keyof typeof sessions] = sessions.active,
  search = "",
) {
  return renderWithProviders(<App />, {
    route: `/dashboard/transactions${search}`,
    session,
  });
}

const list = () => screen.getByRole("region", { name: "All transactions" });
const rows = async () => (await within(list()).findAllByRole("row")).slice(1);
const pagination = () => screen.getByRole("navigation", { name: "Pagination" });
const lastRequest = (requests: Record<string, string>[]) =>
  requests[requests.length - 1];

describe("Transactions page", () => {
  it("loads the first page with the API defaults", async () => {
    const { pagination: page } = await customersApi.getTransactions(id);
    const requests = recordRequests();
    renderTransactions();

    expect(
      screen.getByRole("heading", { level: 1, name: "Transactions" }),
    ).toBeInTheDocument();
    expect(await rows()).toHaveLength(20);
    expect(lastRequest(requests)).toEqual({
      limit: "20",
      offset: "0",
      sortBy: "date_desc",
    });
    expect(
      within(pagination()).getByText(
        `Showing 1–20 of ${formatCount(page.total)}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(pagination()).getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  });

  it("pages forward and back with offset", async () => {
    const requests = recordRequests();
    const { user } = renderTransactions();
    const firstPage = (await rows()).map((row) => row.textContent);

    await user.click(
      within(pagination()).getByRole("button", { name: "Next page" }),
    );

    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({ offset: "20" }),
    );
    expect(
      await within(pagination()).findByText(/^Showing 21–40 of/),
    ).toBeInTheDocument();
    expect(within(pagination()).getByText(/^Page 2 of/)).toBeInTheDocument();
    await waitFor(async () =>
      expect((await rows())[0]).not.toHaveTextContent(firstPage[0] ?? ""),
    );

    await user.click(
      within(pagination()).getByRole("button", { name: "Previous page" }),
    );
    expect(
      await within(pagination()).findByText(/^Showing 1–20 of/),
    ).toBeInTheDocument();
  });

  it("filters by category with the API's category parameter", async () => {
    const requests = recordRequests();
    const { user } = renderTransactions();
    await rows();

    await chooseOption(
      user,
      await screen.findByRole("combobox", { name: "Category" }),
      "Dining",
    );

    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({
        category: "Dining",
        offset: "0",
      }),
    );
    await waitFor(async () => {
      for (const row of await rows()) {
        expect(row).toHaveTextContent("Dining");
      }
    });
  });

  it("sorts with the API's sortBy parameter", async () => {
    const { transactions } = await customersApi.getTransactions(id, {
      sortBy: "amount_desc",
      limit: 1,
    });
    const requests = recordRequests();
    const { user } = renderTransactions();
    await rows();

    await chooseOption(
      user,
      screen.getByRole("combobox", { name: "Sort by" }),
      "Highest amount",
    );

    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({ sortBy: "amount_desc" }),
    );
    await waitFor(async () =>
      expect((await rows())[0]).toHaveTextContent(
        formatCurrency(transactions[0].amount),
      ),
    );
  });

  it("filters by dates with startDate and endDate", async () => {
    const requests = recordRequests();
    const { user } = renderTransactions();
    await rows();

    await pickDateRange(
      user,
      screen.getByRole("group", { name: "Dates" }),
      "2024-09-01",
      "2024-09-10",
    );

    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({
        startDate: "2024-09-01",
        endDate: "2024-09-10",
        offset: "0",
      }),
    );
  });

  it("moves on to the end date after picking a start, and waits for both", async () => {
    const requests = recordRequests();
    const { user } = renderTransactions();
    await rows();
    const fields = screen.getByRole("group", { name: "Dates" });
    expect(
      within(fields).getByRole("button", { name: "From: Select date" }),
    ).toBeInTheDocument();
    const before = requests.length;

    await user.click(within(fields).getByRole("button", { name: /^From:/ }));
    await clickDay(user, startDialog(), "2024-09-01");

    // The end-date calendar opens straight away; nothing is applied yet.
    expect(endDialog()).toBeInTheDocument();
    expect(requests).toHaveLength(before);

    await clickDay(user, endDialog(), "2024-09-10");
    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({
        startDate: "2024-09-01",
        endDate: "2024-09-10",
      }),
    );
  });

  it("changes the page size with limit and starts from page 1", async () => {
    const requests = recordRequests();
    const { user } = renderTransactions(sessions.active, "?page=3");
    await rows();

    await chooseOption(
      user,
      within(pagination()).getByRole("combobox", { name: "Rows per page" }),
      "50",
    );

    await waitFor(() =>
      expect(lastRequest(requests)).toMatchObject({
        limit: "50",
        offset: "0",
      }),
    );
    await waitFor(async () => expect(await rows()).toHaveLength(50));
  });

  it("restores the view from the URL", async () => {
    const requests = recordRequests();
    renderTransactions(
      sessions.active,
      "?category=Dining&sortBy=date_asc&page=2&size=10",
    );
    await rows();

    await waitFor(() =>
      expect(lastRequest(requests)).toEqual({
        limit: "10",
        offset: "10",
        sortBy: "date_asc",
        category: "Dining",
      }),
    );
    expect(
      screen.getByRole("combobox", { name: "Category" }),
    ).toHaveTextContent("Dining");
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent(
      "Oldest first",
    );
  });

  it("ignores a category the API doesn't know", async () => {
    const requests = recordRequests();
    renderTransactions(sessions.active, "?category=Pets");

    expect(await rows()).toHaveLength(20);
    expect(requests.every((params) => !("category" in params))).toBe(true);
  });

  it("moves to the last page when the page is past the end", async () => {
    const { pagination: page } = await customersApi.getTransactions(id);
    const last = Math.ceil(page.total / 20);
    renderTransactions(sessions.active, "?page=999");

    expect(
      await within(list()).findByText(
        `Page ${formatCount(last)} of ${formatCount(last)}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(pagination()).getByRole("button", { name: "Next page" }),
    ).toBeDisabled();
  });

  it("clears the filters", async () => {
    const { user } = renderTransactions(sessions.active, "?category=Dining");
    await rows();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(
      screen.getByRole("combobox", { name: "Category" }),
    ).toHaveTextContent("All categories");
    expect(
      screen.queryByRole("button", { name: "Clear filters" }),
    ).not.toBeInTheDocument();
  });

  it("opens the details drawer from the table", async () => {
    const { user } = renderTransactions();
    const [first] = await rows();

    await user.click(within(first).getAllByRole("cell").at(-1) as HTMLElement);

    expect(
      screen.getByRole("dialog", { name: "Transaction details" }),
    ).toBeInTheDocument();
  });

  it("explains when no transactions match the filters", async () => {
    renderTransactions(
      sessions.active,
      "?category=Utilities&from=2024-09-15&to=2024-09-15",
    );

    expect(
      await screen.findByText(/no transactions match these filters/i),
    ).toBeInTheDocument();
  });

  it("shows the empty state for a customer with no transactions", async () => {
    renderTransactions(sessions.empty);

    expect(await screen.findByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it("shows an error with retry when the service fails", async () => {
    renderTransactions(sessions.error);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("has no detectable accessibility violations once loaded", async () => {
    const { container } = renderTransactions();
    await rows();

    await expectNoA11yViolations(container);
  });
});
