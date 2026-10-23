import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "../App";
import { EMPTY_USER } from "../mocks/fixtures";
import { server } from "../mocks/server";
import { expectNoA11yViolations } from "../test/axe";
import { buildSignInValues, sessions } from "../test/factories";
import { renderWithProviders } from "../test/render";

type User = ReturnType<typeof renderWithProviders>["user"];

// Rendered through App so sign-in can navigate to the dashboard.
function setup(options: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<App />, { route: "/", ...options });
}

async function openSignIn(user: User) {
  await user.click(
    screen.getByRole("button", { name: /sign in to continue/i }),
  );
  return screen.getByRole("dialog", { name: "Sign in" });
}

async function submitCredentials(
  user: User,
  dialog: HTMLElement,
  values = buildSignInValues(),
) {
  await user.type(
    screen.getByLabelText(/account number/i),
    values.accountNumber,
  );
  await user.type(screen.getByLabelText(/^pin$/i), values.pin);
  await user.click(within(dialog).getByRole("button", { name: /^sign in$/i }));
}

describe("LandingPage", () => {
  it("renders the hero and all feature cards", () => {
    setup();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /understand your spending/i,
      }),
    ).toBeInTheDocument();
    for (const title of [
      /spending trends/i,
      /category insights/i,
      /transaction history/i,
      /set your goals/i,
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });
});

describe("LandingPage sign in", () => {
  it("opens the popup with the account number focused and the PIN empty", async () => {
    const { user } = setup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await openSignIn(user);

    expect(screen.getByLabelText(/account number/i)).toHaveFocus();
    expect(screen.getByLabelText(/^pin$/i)).toHaveValue("");
  });

  it("opens from the header sign in button", async () => {
    const { user } = setup();

    await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows validation errors and does not send invalid details", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await user.type(screen.getByLabelText(/account number/i), "1234");
    await user.click(
      within(dialog).getByRole("button", { name: /^sign in$/i }),
    );

    expect(
      screen.getByText(/account number must be exactly 14 digits/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/please enter your pin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("re-validates as the user types after a failed submit", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await user.click(
      within(dialog).getByRole("button", { name: /^sign in$/i }),
    );
    expect(
      screen.getByText(/please enter your account number/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/account number/i), "12345678901234");
    expect(
      screen.queryByText(/please enter your account number/i),
    ).not.toBeInTheDocument();
  });

  it("strips non-digit characters and caps input length", async () => {
    const { user } = setup();
    await openSignIn(user);

    const account = screen.getByLabelText(/account number/i);
    await user.type(account, "12ab34-5678 9012345678");
    expect(account).toHaveValue("12345678901234");

    const pin = screen.getByLabelText(/^pin$/i);
    await user.type(pin, "9x87654");
    expect(pin).toHaveValue("98765");
  });

  it("toggles PIN visibility", async () => {
    const { user } = setup();
    await openSignIn(user);

    const pin = screen.getByLabelText(/^pin$/i);
    expect(pin).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show pin/i }));
    expect(pin).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide pin/i }));
    expect(pin).toHaveAttribute("type", "password");
  });

  it("signs in with valid details and opens the dashboard", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await submitCredentials(user, dialog);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /good (morning|afternoon|evening), john/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("signs in each demo user as themselves", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await submitCredentials(
      user,
      dialog,
      buildSignInValues({
        accountNumber: EMPTY_USER.accountNumber,
        pin: EMPTY_USER.pin,
      }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: /thandi/i }),
    ).toBeInTheDocument();
  });

  it("shows an error and stays open when the details are wrong", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await submitCredentials(user, dialog, buildSignInValues({ pin: "99999" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /incorrect account number or pin/i,
    );
    expect(
      within(dialog).getByRole("button", { name: /^sign in$/i }),
    ).toBeEnabled();

    // Editing a field clears the server error.
    await user.type(screen.getByLabelText(/^pin$/i), "{Backspace}");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a generic error when sign in fails for another reason", async () => {
    server.use(
      http.post("*/auth/sign-in", () =>
        HttpResponse.json({ message: "Down" }, { status: 503 }),
      ),
    );
    const { user } = setup();
    const dialog = await openSignIn(user);

    await submitCredentials(user, dialog);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /couldn't sign you in right now/i,
    );
  });

  it("goes straight to the dashboard when already signed in", async () => {
    const { user } = setup({ session: sessions.active });

    await user.click(
      screen.getByRole("button", { name: /sign in to continue/i }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: /john/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  const closeActions: [string, (user: User) => Promise<void>][] = [
    ["Escape", (user) => user.keyboard("{Escape}")],
    [
      "the close button",
      (user) =>
        user.click(screen.getByRole("button", { name: /close sign in/i })),
    ],
    [
      "the open account link",
      (user) =>
        user.click(
          within(screen.getByRole("dialog")).getByRole("link", {
            name: /open an account/i,
          }),
        ),
    ],
  ];

  it.each(closeActions)(
    "closes and resets the form via %s",
    async (_name, close) => {
      const { user } = setup();
      await openSignIn(user);
      await user.type(screen.getByLabelText(/account number/i), "123");

      await close(user);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await openSignIn(user);
      expect(screen.getByLabelText(/account number/i)).toHaveValue("");
    },
  );

  it("closes when clicking the backdrop but not the panel", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await user.click(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // The backdrop has no role, so it is located by test id.
    await user.click(screen.getByTestId("sign-in-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger when closed", async () => {
    const { user } = setup();
    const trigger = screen.getByRole("button", {
      name: /sign in to continue/i,
    });

    await openSignIn(user);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("has no detectable accessibility violations while open", async () => {
    const { user } = setup();
    const dialog = await openSignIn(user);

    await expectNoA11yViolations(dialog);
  });
});
