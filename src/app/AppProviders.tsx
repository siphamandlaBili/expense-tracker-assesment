import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { i18n as I18n } from "i18next";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { AuthProvider } from "../auth/AuthProvider";

type AppProvidersProps = {
  queryClient: QueryClient;
  i18n: I18n;
  children: ReactNode;
};

/**
 * Every app-wide provider. Used by both main.tsx and the test render helper,
 * so tests run components in the same context as production.
 */
export function AppProviders({
  queryClient,
  i18n,
  children,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>{children}</AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
