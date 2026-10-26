# Moya Bank: Customer Spending Insights

A dashboard where a bank customer sees where their money goes: spending
summary, categories, monthly trends, transactions, budget goals and profile.

Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React
Router, zod and i18next. Data comes from the hosted [spending API](#api), a
separate service; see the [demo sign-in](#demo-sign-in) accounts.

## Requirements

- **Docker** to build and run the container, or
- **Node.js 24** and npm to run locally (`.nvmrc` pins the version).

## Run with Docker

```sh
docker build -t spending-insights .
docker run --rm -p 8080:8080 spending-insights
```

Open http://localhost:8080 and sign in with account `12345678901234`, PIN
`12345`.

The image is built in stages: dependencies, then a production build, then
only the static files served by nginx as a non-root user. The image includes:

- **SPA routing:** any client-side route (`/dashboard/goals`, …) serves the
  app.
- **Caching:** hashed files under `/assets` are cached for a year;
  `index.html` is always revalidated.
- **Security headers:** a Content Security Policy, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. They
  are set in `docker/security-headers.inc`.
- **Health check:** `GET /healthz` returns `200 ok` and Docker's
  `HEALTHCHECK` uses it.

Run the lint, typecheck and unit tests inside Docker (no local Node needed):

```sh
docker build --target test .
```

To use a different API, pass its URL as a build argument (Vite bakes it into
the bundle at build time) and add its origin to `connect-src` in
`docker/security-headers.inc`:

```sh
docker build -t spending-insights \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api .
```

## Run locally

```sh
npm ci
npm run dev        # http://localhost:5173, with hot reload
```

To run the production build locally:

```sh
npm run build
npm run preview    # http://localhost:4173
```

Measure performance (Lighthouse) against `npm run preview`, not the dev
server. The dev server serves unbundled, unminified code and scores far
lower.

## Test

```sh
npm run lint            # ESLint, fails on any warning
npm run typecheck       # app, tests and e2e
npm run test:coverage   # unit and component tests, 80% coverage gate
npx playwright install chromium   # first time only
npm run test:e2e        # Playwright on desktop and mobile, production build
```

See [Testing](#testing) for how the tests are organised and written.

## Scripts

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start the dev server                          |
| `npm run build`         | Typecheck and build for production            |
| `npm run preview`       | Serve the production build                    |
| `npm run lint`          | Lint (fails on any warning)                   |
| `npm run typecheck`     | Typecheck app, tests, and e2e                 |
| `npm run format:check`  | Check formatting with Prettier                |
| `npm test`              | Unit/component tests in watch mode            |
| `npm run test:coverage` | Unit/component tests once, with coverage gate |
| `npm run test:e2e`      | Playwright tests against the production build |
| `npm run test:e2e:ui`   | Playwright in interactive UI mode             |

## Project structure

```
src/
  api/          zod schemas, fetch client, React Query hooks and mutations
  app/          app-wide providers and the QueryClient
  auth/         session, AuthProvider, RequireAuth
  components/
    charts/     TrendChart, CategoryDonut, shared chart colours
    dashboard/  shared dashboard UI: Panel + QueryContent (loading, error and
                empty states), PageHeader, ChangeIndicator, CategoryBadge,
                StatCards, sidebar, drawer
    spending/   pieces used only by the Spending page
    landing/    landing page sections
  lib/          pure helpers (formatting, filters, series bucketing) and hooks
  pages/        one component per route
  test/         render helpers, factories, axe helper, fake API for tests
```

Conventions that keep pages consistent:

- **Page heading:** every page starts with `PageHeader`.
- **Cards:** every card is a `Panel`, and data inside it renders through
  `QueryContent`, so loading, error (with retry) and empty states look and
  behave the same everywhere.
- **Charts:** use the chart components in `components/charts`. They take data
  and labels, not API responses, so any page can reuse them.
- **Text:** all visible text lives in `src/i18n/locales/en.json`.

## API

The app calls the spending API, a separate service:

- **URL:** https://expense-tracker-data-qypy.vercel.app/api
- **Code:** https://github.com/siphamandlaBili/expense-tracker-data (Express,
  MongoDB for goals, hosted on Vercel)

To use another API, set `VITE_API_BASE_URL` at build time (see
`src/api/config.ts`).

The app talks to it through typed React Query hooks:

- `src/api/queries.ts`: `useProfile`, `useSpendingSummary`,
  `useSpendingByCategory`, `useSpendingTrends`, `useTransactions`, `useGoals`,
  `useFilters`.
- `src/api/mutations.ts`: `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`.
- Every response is validated against the zod schemas in `src/api/schemas.ts`.

### Demo sign-in

| Account number   | PIN     | Customer | Shows                                         |
| ---------------- | ------- | -------- | --------------------------------------------- |
| `12345678901234` | `12345` | 12345    | Full data: two years of transactions, 2 goals |
| `23456789012345` | `23456` | 23456    | Empty states: a new customer with no activity |
| `34567890123456` | `34567` | 34567    | Error states: spending endpoints return 500   |

Sign-in calls `POST /api/auth/sign-in`; any other combination returns 401.
The session is kept in `sessionStorage`, so it ends when the tab closes. Goals
are stored by the API, so goal changes are shared by everyone using a demo
account.

### Spending page filters

Each control only offers what its endpoint accepts:

| Control                    | Endpoint               | Parameters                    |
| -------------------------- | ---------------------- | ----------------------------- |
| Period buttons             | `/spending/summary`    | `period`                      |
|                            | `/spending/categories` | `period`                      |
| Trend length picker        | `/spending/trends`     | `months` (3, 6, 12, 24)       |
| Category card custom dates | `/spending/categories` | `startDate`, `endDate`        |
| Category chips             | none (display filter)  | filters the categories result |

The period presets and the category chips come from `/filters`. Filters are
kept in the URL (`?period=90d&months=24&from=…&to=…&categories=Dining`).

### Transactions page filters

| Control           | `/transactions` parameter           |
| ----------------- | ----------------------------------- |
| Category dropdown | `category` (one category)           |
| Date picker       | `startDate`, `endDate`              |
| Sort dropdown     | `sortBy` (date or amount, asc/desc) |
| Rows per page     | `limit` (10, 20 or 50)              |
| Previous / next   | `offset`; totals from `pagination`  |

Any filter change returns to page 1; a page past the end moves to the last
page. The view is kept in the URL (`?category=Dining&page=2&size=10`).

## Testing

### Layers

- **Unit and component tests** (Vitest, jsdom, Testing Library) sit next to the
  code they test as `*.test.ts(x)`.
- **End-to-end tests** (Playwright) live in `e2e/` and run against the
  production build on a desktop and a mobile viewport, calling the live API.
  Use them for anything jsdom cannot do: layout, CSS, focus styles, scroll
  locking, colour contrast.

### Writing component tests

- Render with `renderWithProviders()` from `src/test/render.tsx`, not plain
  `render()`. It wraps the component in React Query (fresh client per test, no
  retries), the router (`route` option sets the URL) and a test i18n instance,
  and returns a ready `user` from `userEvent.setup()`.
- Query by role and label (`getByRole`, `getByLabelText`). Use `getByTestId`
  only for elements with no accessible role.
- Build test data with the factories in `src/test/factories.ts` and override
  only the fields the test cares about.
- Call `expectNoA11yViolations(container)` from `src/test/axe.ts` for any new
  page or interactive component.

### Network

Unit tests never reach the network. `fetch` is replaced by a fake API
(`src/test/fakeApi`) that behaves like the real one over seeded data with a
fixed date, so results are identical every run.

- Override a route in a single test with `fakeApi.use(http.get(...))`;
  overrides reset after each test.
- Check what was sent with `fakeApi.onRequest(...)`.
- A request with no matching route **fails**.

### Translations

- Translation keys are type-checked against `src/i18n/locales/en.json`, so a
  typo is a compile error.
- In tests, a missing key throws instead of rendering the raw key.

### Quality gates

- **Pre-commit:** lint and format staged files, run only the tests related to
  them, typecheck.
- **CI (`.github/workflows/ci.yml`):** typecheck, lint, format, unit tests with
  an 80% coverage threshold, build, Playwright e2e, and a Docker build that
  starts the container and checks it serves the app. The HTML coverage report
  and, on failure, the Playwright report are uploaded as artifacts.
