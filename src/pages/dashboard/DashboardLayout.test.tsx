import {
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../../App";
import { readSession } from "../../auth/session";
import { expectNoA11yViolations } from "../../test/axe";
import { sessions } from "../../test/factories";
import { renderWithProviders } from "../../test/render";

/** The account menu panel, once open. */
const accountMenu = () => screen.findByRole("navigation", { name: "Account" });

const dashboardNav = () =>
  screen.getAllByRole("navigation", { name: "Dashboard" })[0];

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

  it("marks the current section in the side navigation", async () => {
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

  it("signs out and returns to the landing page", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    await user.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });

  it("slides the navigation drawer out before removing it", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });

    await user.click(screen.getByRole("button", { name: /open navigation/i }));
    const drawerNav = screen.getAllByRole("navigation", {
      name: "Dashboard",
    })[1];

    await user.click(screen.getByRole("button", { name: /close navigation/i }));

    // Still on screen while it slides out, then removed.
    expect(drawerNav).toBeInTheDocument();
    await waitForElementToBeRemoved(drawerNav);
  });

  it("opens and closes the mobile navigation drawer", async () => {
    const { user } = renderWithProviders(<App />, {
      route: "/dashboard",
      session: sessions.active,
    });
    const menuButton = screen.getByRole("button", { name: /open navigation/i });

    await user.click(menuButton);
    expect(
      screen.getAllByRole("navigation", { name: "Dashboard" }),
    ).toHaveLength(2);

    await user.keyboard("{Escape}");
    expect(
      screen.getAllByRole("navigation", { name: "Dashboard" }),
    ).toHaveLength(1);

    await user.click(menuButton);
    await user.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(
      screen.getAllByRole("navigation", { name: "Dashboard" }),
    ).toHaveLength(1);

    // Choosing a link closes the drawer too.
    await user.click(menuButton);
    const drawerNav = screen.getAllByRole("navigation", {
      name: "Dashboard",
    })[1];
    await user.click(within(drawerNav).getByRole("link", { name: "Profile" }));
    expect(
      screen.getAllByRole("navigation", { name: "Dashboard" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeInTheDocument();
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
