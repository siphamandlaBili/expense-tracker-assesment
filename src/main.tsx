import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { setMockReady } from "./api/mockGate";
import { AppProviders } from "./app/AppProviders";
import { createQueryClient } from "./app/queryClient";
import i18n from "./i18n";
import "./App.css";

if (import.meta.env.VITE_ENABLE_MOCKS === "true") {
  // Starts in parallel with the first render; API calls wait for it
  // (mockGate), the page itself doesn't. Loaded on demand so the mock code
  // is never downloaded when mocks are off.
  setMockReady(
    import("./mocks/browser").then(({ worker }) =>
      worker.start({
        onUnhandledFrame: "bypass",
        serviceWorker: {
          url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
        },
        quiet: import.meta.env.PROD,
      }),
    ),
  );
}

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient} i18n={i18n}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
