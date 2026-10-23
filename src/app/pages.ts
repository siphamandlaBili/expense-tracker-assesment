import { lazyPage } from "./lazyPage";

// Dashboard pages (and the charts they pull in) are split out of the main
// bundle, so the landing page doesn't download them.

export const OverviewPage = lazyPage(() =>
  import("../pages/dashboard/OverviewPage").then((m) => m.OverviewPage),
);
export const SpendingPage = lazyPage(() =>
  import("../pages/dashboard/SpendingPage").then((m) => m.SpendingPage),
);
export const TransactionsPage = lazyPage(() =>
  import("../pages/dashboard/TransactionsPage").then((m) => m.TransactionsPage),
);
export const GoalsPage = lazyPage(() =>
  import("../pages/dashboard/GoalsPage").then((m) => m.GoalsPage),
);
export const ProfilePage = lazyPage(() =>
  import("../pages/dashboard/ProfilePage").then((m) => m.ProfilePage),
);

/** Fetches every dashboard page, so moving between them never waits. */
export function preloadDashboardPages() {
  return Promise.all(
    [OverviewPage, SpendingPage, TransactionsPage, GoalsPage, ProfilePage].map(
      (page) => page.preload(),
    ),
  );
}
