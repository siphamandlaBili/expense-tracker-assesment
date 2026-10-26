import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../../App";
import { readSession } from "../../auth/session";
import { expectNoA11yViolations } from "../../test/axe";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

/** The account menu panel, once open. */
const accountMenu = () => screen.findByRole("navigation", { name: "Account" });

// jsdom has no matchMedia, so the layout renders as on a phone: the bottom
// bar rather than the sidebar (see "shows the sidebar from tablet width up").
const dashboardNav = () =>
  screen.getByRole("navigation", { name: "Dashboard" });

describe("Dashboard layout", () => {
  it("sends signed-out visitors back to the landing page", () => {
    renderWithProviders(<App />, { route: "/dashboard" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
  });

  it("navigates from the bottom bar and marks the current page", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    expect(
      within(dashboardNav()).getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(
      within(dashboardNav()).getByRole("link", { name: "Goals" }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Spending goals" }),
    ).toBeInTheDocument();
    expect(
      within(dashboardNav()).getByRole("link", { name: "Goals" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(dashboardNav()).getByRole("link", { name: "Overview" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("opens an account menu from the avatar", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });
    const avatar = screen.getByRole("button", {
      name: "Signed in as John Doe",
    });
    expect(avatar).toHaveAttribute("aria-expanded", "false");

    await user.click(avatar);

    expect(avatar).toHaveAttribute("aria-expanded", "true");
    const menu = await accountMenu();
    expect(within(menu).getByText("John Doe")).toBeVisible();
    expect(await within(menu).findByText("john.doe@email.com")).toBeVisible();
  });

  it("goes to the profile from the account menu", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    await user.click(
      screen.getByRole("button", { name: "Signed in as John Doe" }),
    );
    await user.click(
      within(await accountMenu()).getByRole("link", { name: "Profile" }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Signed in as John Doe" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("signs out from the account menu", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    await user.click(
      screen.getByRole("button", { name: "Signed in as John Doe" }),
    );
    await user.click(
      within(await accountMenu()).getByRole("button", { name: "Sign out" }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });

  it("closes the account menu with Escape or a click outside", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });
    const avatar = screen.getByRole("button", {
      name: "Signed in as John Doe",
    });

    await user.click(avatar);
    await user.keyboard("{Escape}");
    expect(avatar).toHaveAttribute("aria-expanded", "false");
    expect(avatar).toHaveFocus();

    await user.click(avatar);
    await user.click(screen.getByRole("heading", { level: 1 }));
    expect(avatar).toHaveAttribute("aria-expanded", "false");
  });

  it("shows an empty notifications panel from the bell", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell).toHaveAttribute("aria-expanded", "false");

    await user.click(bell);

    expect(bell).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "Notifications" });
    expect(within(panel).getByText("No notifications")).toBeVisible();

    await user.keyboard("{Escape}");
    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(bell).toHaveFocus();
  });

  it("opening the account menu closes notifications", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });
    const bell = screen.getByRole("button", { name: "Notifications" });

    await user.click(bell);
    await user.click(
      screen.getByRole("button", { name: "Signed in as John Doe" }),
    );

    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(await accountMenu()).toBeVisible();
  });

  it("shows the sidebar from tablet width up, and signs out from it", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(min-width: 48rem)",
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    // One navigation only: the sidebar, with no bottom bar.
    expect(
      within(screen.getByRole("complementary")).getByRole("navigation", {
        name: "Dashboard",
      }),
    ).toBe(dashboardNav());

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });

  it("redirects unknown URLs to the landing page", () => {
    renderWithProviders(<App />, { route: "/nowhere" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderWithProviders(<App />, {
      route: "/dashboard/spending",
      session: sessions.active,
    });

    await expectNoA11yViolations(container);
  });
});
