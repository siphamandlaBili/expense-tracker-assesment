import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { customersApi } from "../../api/customers";
import { formatCurrency } from "../../lib/format";
import { ACTIVE_USER } from "../../mocks/fixtures";
import { server } from "../../mocks/server";
import { expectNoA11yViolations } from "../../test/axe";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

function renderProfile(
  session: (typeof sessions)[keyof typeof sessions] = sessions.active,
) {
  return renderWithProviders(<App />, {
    route: "/dashboard/profile",
    session,
  });
}

const card = () => screen.getByRole("region", { name: "Account details" });

describe("Profile page", () => {
  it("shows every profile field exactly once", async () => {
    const profile = await customersApi.getProfile(ACTIVE_USER.customerId);
    renderProfile();

    expect(
      screen.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeInTheDocument();
    expect(await within(card()).findByText("John Doe")).toBeInTheDocument();

    // getByText throws if a value appears more than once.
    for (const value of [
      "john.doe@email.com",
      "Premium Account",
      formatCurrency(profile.totalSpent),
      "12345",
      "15 Jan 2023",
      "South African Rand (ZAR)",
    ]) {
      expect(within(card()).getByText(value)).toBeInTheDocument();
    }
    for (const label of ["Customer ID", "Member since", "Currency"]) {
      expect(within(card()).getByText(label)).toBeInTheDocument();
    }
  });

  it("shows a new customer's profile with nothing spent", async () => {
    renderProfile(sessions.empty);

    expect(await within(card()).findByText("Thandi Nkosi")).toBeInTheDocument();
    expect(within(card()).getByText("R0.00")).toBeInTheDocument();
    expect(within(card()).getByText("Standard Account")).toBeInTheDocument();
  });

  it("shows one error with retry when the profile can't load", async () => {
    server.use(
      http.get("*/customers/:customerId/profile", () =>
        HttpResponse.json({ message: "Down" }, { status: 500 }),
      ),
    );
    const { user } = renderProfile();

    const retry = await screen.findByRole("button", { name: /try again/i });
    expect(screen.getAllByRole("button", { name: /try again/i })).toHaveLength(
      1,
    );

    server.resetHandlers();
    await user.click(retry);

    expect(await within(card()).findByText("John Doe")).toBeInTheDocument();
  });

  it("has no detectable accessibility violations once loaded", async () => {
    const { container } = renderProfile();
    await within(card()).findByText("John Doe");

    await expectNoA11yViolations(container);
  });
});
