import { QueryClient } from "@tanstack/react-query";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AppProviders } from "../app/AppProviders";
import { writeSession, type Session } from "../auth/session";
import { testI18n } from "./i18n";

type ProviderOptions = {
  /** Initial URL for the in-memory router. */
  route?: string;
  queryClient?: QueryClient;
  /** Render as this signed-in user (see MOCK_USERS). */
  session?: Session;
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function createWrapper({
  route = "/",
  queryClient = createTestQueryClient(),
  session,
}: ProviderOptions) {
  // Written before render so AuthProvider starts signed in.
  if (session) writeSession(session);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders queryClient={queryClient} i18n={testI18n}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AppProviders>
    );
  }
  return { Wrapper, queryClient };
}

/**
 * Renders `ui` inside the same providers as the real app, with a fresh
 * QueryClient per test so cached data never leaks between tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route,
    queryClient: client,
    session,
    ...options
  }: Omit<RenderOptions, "wrapper"> & ProviderOptions = {},
) {
  const { Wrapper, queryClient } = createWrapper({
    route,
    queryClient: client,
    session,
  });
  const user = userEvent.setup();

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

/** renderHook equivalent of renderWithProviders, for query/mutation hooks. */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  {
    route,
    queryClient: client,
    session,
    ...options
  }: Omit<RenderHookOptions<Props>, "wrapper"> & ProviderOptions = {},
) {
  const { Wrapper, queryClient } = createWrapper({
    route,
    queryClient: client,
    session,
  });

  return {
    queryClient,
    ...renderHook(hook, { wrapper: Wrapper, ...options }),
  };
}
