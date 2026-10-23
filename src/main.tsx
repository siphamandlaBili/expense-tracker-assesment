import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { AppProviders } from "./app/AppProviders";
import { createQueryClient } from "./app/queryClient";
import i18n from "./i18n";
import "./App.css";

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== "true") return;

  // Loaded on demand so the mock code is never downloaded when mocks are off.
  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledFrame: "bypass",
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: import.meta.env.PROD,
  });
}

const queryClient = createQueryClient();

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders queryClient={queryClient} i18n={i18n}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProviders>
    </StrictMode>,
  );
});
