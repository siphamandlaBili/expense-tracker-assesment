import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeApi, http, profileInCurrency } from "../../test/fakeApi";
import App from "../../App";
import { customersApi } from "../../api/customers";
import { formatCurrency } from "../../lib/format";
import { ACTIVE_USER } from "../../test/fakeApi/fixtures";
import { expectNoA11yViolations } from "../../test/axe";
import { sessions } from "../../test/factories";
import { chooseOption } from "../../test/interactions";
import { renderWithProviders } from "../../test/render";

function renderGoals(
  session: (typeof sessions)[keyof typeof sessions] = sessions.active,
) {
  return renderWithProviders(<App />, {
    route: "/dashboard/goals",
    session,
  });
}

const card = (category: string) =>
  screen.getByRole("article", { name: category });
const findCard = (category: string) =>
  screen.findByRole("article", { name: category });
type User = ReturnType<typeof renderGoals>["user"];
/** Opens a goal's details drawer by clicking its card. */
const openGoal = async (user: User, category: string) => {
  await user.click(
    within(await findCard(category)).getByRole("button", {
      name: `${category}, view details`,
    }),
  );
  return screen.getByRole("dialog", { name: "Goal details" });
};

describe("Goals page", () => {
  it("shows each goal from the API with its status and progress", async () => {
    const { goals } = await customersApi.getGoals(ACTIVE_USER.customerId);
    renderGoals();

    expect(
      screen.getByRole("heading", { level: 1, name: "Spending goals" }),
    ).toBeInTheDocument();
    expect(await screen.findAllByRole("article")).toHaveLength(goals.length);

    for (const goal of goals) {
      const goalCard = card(goal.category);
      expect(
        within(goalCard).getByText(
          `Monthly budget: ${formatCurrency(goal.monthlyBudget)}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(goalCard).getByText(
          `${formatCurrency(goal.currentSpent)} spent`,
        ),
      ).toBeInTheDocument();
      expect(
        within(goalCard).getByText(`${goal.daysRemaining} days left`),
      ).toBeInTheDocument();
      expect(
        within(goalCard).getByText(
          { on_track: "On track", warning: "Warning", exceeded: "Over budget" }[
            goal.status
          ],
        ),
      ).toBeInTheDocument();
      expect(
        within(goalCard).getByRole("progressbar", {
          name: `${goal.category} budget used`,
        }),
      ).toHaveValue(Math.min(Math.round(goal.percentageUsed), 100));
    }
  });

  it("opens a goal's details in a drawer", async () => {
    const { goals } = await customersApi.getGoals(ACTIVE_USER.customerId);
    const groceries = goals.find((goal) => goal.category === "Groceries");
    if (!groceries) throw new Error("fixture has a Groceries goal");
    const { user } = renderGoals();

    const drawer = await openGoal(user, "Groceries");

    const remaining = groceries.monthlyBudget - groceries.currentSpent;
    expect(
      within(drawer).getByText(
        `spent of ${formatCurrency(groceries.monthlyBudget)}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText(remaining >= 0 ? "Remaining" : "Over budget by"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText(formatCurrency(Math.abs(remaining))),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("progressbar", {
        name: "Groceries budget used",
      }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: /close goal details/i }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a goal for a category that doesn't have one", async () => {
    const { user } = renderGoals();
    await findCard("Groceries");

    await user.click(screen.getByRole("button", { name: "Create goal" }));
    const dialog = screen.getByRole("dialog", { name: "Create a goal" });
    const category = within(dialog).getByRole("combobox", {
      name: "Category",
    });

    // Categories that already have a goal aren't offered.
    await user.click(category);
    expect(
      screen.queryByRole("option", { name: "Groceries" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await chooseOption(user, category, "Dining");
    await user.type(within(dialog).getByLabelText("Monthly budget"), "800");
    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );

    expect(await findCard("Dining")).toHaveTextContent(
      "Monthly budget: R800.00",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("validates the budget before saving", async () => {
    const { user } = renderGoals();
    await findCard("Groceries");
    await user.click(screen.getByRole("button", { name: "Create goal" }));
    const dialog = screen.getByRole("dialog", { name: "Create a goal" });
    const budget = within(dialog).getByLabelText("Monthly budget");

    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );
    expect(budget).toHaveAccessibleDescription("Enter a monthly budget.");
    expect(budget).toHaveAttribute("aria-invalid", "true");

    await user.type(budget, "12.345");
    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );
    expect(budget).toHaveAccessibleDescription(
      "Enter an amount like 1500 or 1500.50.",
    );
  });

  it("takes the budget in the profile currency", async () => {
    fakeApi.use(profileInCurrency("USD"));
    const { user } = renderGoals();
    await findCard("Groceries");
    await user.click(screen.getByRole("button", { name: "Create goal" }));
    const dialog = screen.getByRole("dialog", { name: "Create a goal" });

    expect(within(dialog).getByText("$")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Monthly budget"), "$500");
    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );

    expect(await findCard("Transportation")).toHaveTextContent(
      "Monthly budget: $500.00",
    );
  });

  it("explains a duplicate goal reported by the API", async () => {
    fakeApi.use(
      http.post("*/customers/:customerId/goals", () =>
        Response.json({ message: "Exists" }, { status: 409 }),
      ),
    );
    const { user } = renderGoals();
    await findCard("Groceries");
    await user.click(screen.getByRole("button", { name: "Create goal" }));
    const dialog = screen.getByRole("dialog", { name: "Create a goal" });

    await user.type(within(dialog).getByLabelText("Monthly budget"), "500");
    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "You already have a goal for this category.",
    );
  });

  it("edits a goal's budget inside the drawer", async () => {
    const { user } = renderGoals();
    const drawer = await openGoal(user, "Groceries");

    await user.click(
      within(drawer).getByRole("button", { name: "Edit budget" }),
    );
    const budget = within(drawer).getByLabelText("Monthly budget");
    expect(budget).toHaveFocus();
    expect(budget).toHaveValue("1500");
    await user.clear(budget);
    await user.type(budget, "2500");
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );

    // The drawer stays open and shows the new figures.
    expect(
      await within(drawer).findByText("spent of R2,500.00"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Edit budget" }),
    ).toBeInTheDocument();
    expect(card("Groceries")).toHaveTextContent("Monthly budget: R2,500.00");
  });

  it("validates the budget when editing in the drawer", async () => {
    const { user } = renderGoals();
    const drawer = await openGoal(user, "Groceries");
    await user.click(
      within(drawer).getByRole("button", { name: "Edit budget" }),
    );
    const budget = within(drawer).getByLabelText("Monthly budget");

    await user.clear(budget);
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );
    expect(budget).toHaveAccessibleDescription("Enter a monthly budget.");

    // Cancel leaves the budget unchanged.
    await user.click(within(drawer).getByRole("button", { name: "Cancel" }));
    expect(within(drawer).getByText("spent of R1,500.00")).toBeInTheDocument();
  });
  it("confirms delete over the drawer, then closes both", async () => {
    const { user } = renderGoals();
    const drawer = await openGoal(user, "Entertainment");
    await user.click(
      within(drawer).getByRole("button", { name: "Delete goal" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Delete Entertainment goal?",
    });
    // The drawer stays open underneath; focus starts on the safe choice.
    expect(drawer).toBeInTheDocument();
    // Cancel is the way out; there is no ✕ as well.
    expect(
      within(dialog).queryByRole("button", { name: /close/i }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus();

    await user.click(
      within(dialog).getByRole("button", { name: "Delete goal" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("article", { name: "Entertainment" }),
    ).not.toBeInTheDocument();
    expect(card("Groceries")).toBeInTheDocument();
  });
  it("cancelling delete (or Escape) returns to the drawer", async () => {
    const { user } = renderGoals();
    const drawer = await openGoal(user, "Entertainment");
    const deleteButton = within(drawer).getByRole("button", {
      name: "Delete goal",
    });

    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("dialog", { name: "Goal details" }),
    ).toBeInTheDocument();
    expect(deleteButton).toHaveFocus();

    // Escape closes only the topmost layer, and the page stays locked
    // while the drawer is still open.
    await user.click(deleteButton);
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Delete Entertainment goal?" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Goal details" }),
    ).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(card("Entertainment")).toBeInTheDocument();
  });
  it("explains when every category already has a goal", async () => {
    for (const category of [
      "Transportation",
      "Dining",
      "Shopping",
      "Utilities",
    ]) {
      await customersApi.createGoal(ACTIVE_USER.customerId, {
        category,
        monthlyBudget: 100,
      });
    }
    const { user } = renderGoals();
    expect(await screen.findAllByRole("article")).toHaveLength(6);

    await user.click(screen.getByRole("button", { name: "Create goal" }));

    expect(
      within(screen.getByRole("dialog")).getByText(
        /every category already has a goal/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows an empty state and lets a new customer create a goal", async () => {
    const { user } = renderGoals(sessions.empty);

    expect(
      await screen.findByText(/haven't set any goals yet/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create goal" }));
    const dialog = screen.getByRole("dialog", { name: "Create a goal" });
    await user.type(within(dialog).getByLabelText("Monthly budget"), "1200");
    await user.click(
      within(dialog).getByRole("button", { name: "Create goal" }),
    );

    expect(await screen.findAllByRole("article")).toHaveLength(1);
  });

  it("shows an error with retry when goals can't load", async () => {
    renderGoals(sessions.error);

    expect(
      await screen.findByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create goal" }),
    ).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations once loaded", async () => {
    const { container } = renderGoals();
    await findCard("Groceries");

    await expectNoA11yViolations(container);
  });
});
