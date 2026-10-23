# Spending Monitor App

## Scripts

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Start the dev server                          |
| `npm run build`         | Typecheck and build for production            |
| `npm run lint`          | Lint (fails on any warning)                   |
| `npm run typecheck`     | Typecheck app, tests, and e2e                 |
| `npm test`              | Unit/component tests in watch mode            |
| `npm run test:coverage` | Unit/component tests once, with coverage gate |
| `npm run test:e2e`      | Playwright tests against the production build |
| `npm run test:e2e:ui`   | Playwright in interactive UI mode             |

First-time e2e setup: `npx playwright install chromium`.

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
  mocks/        MSW handlers and the mock database
  pages/        one component per route
  test/         render helpers, factories, axe helper
```

Conventions that keep pages consistent:

- **Page heading:** every page starts with `PageHeader`.
- **Cards:** every card is a `Panel`, and data inside it renders through
  `QueryContent`, so loading, error (with retry) and empty states look and
  behave the same everywhere.
- **Charts:** use the chart components in `components/charts`. They take data
  and labels, not API responses, so any page can reuse them.
- **Text:** all visible text lives in `src/i18n/locales/en.json`.

## API and mock data

The app talks to the spending API through typed React Query hooks:

- `src/api/queries.ts`: `useProfile`, `useSpendingSummary`,
  `useSpendingByCategory`, `useSpendingTrends`, `useTransactions`, `useGoals`,
  `useFilters`.
- `src/api/mutations.ts`: `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`.
- Every response is validated against the zod schemas in `src/api/schemas.ts`.

Until the real API exists, every request is answered by a mock running in the
browser (MSW, in `src/mocks/`), including in the deployed build. To control it:

| Variable            | Effect                                       |
| ------------------- | -------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `"true"` (set in `.env`) serves the mock API |
| `VITE_API_BASE_URL` | Real API base URL; defaults to `/api`        |

How the mock behaves:

- **Transactions** are about 1,300 generated from a fixed seed over the last 25
  months, ending today. The same day always gives the same data.
- **Figures always agree.** Summary, categories, trends, goal progress and the
  profile total are all calculated from those transactions.
- **Errors follow the API contract.** Bad input returns 400, an unknown customer
  or goal 404, and a duplicate goal 409.
- **Goals are editable**, and changes are saved in the browser's localStorage so
  they survive a reload. Each visitor has their own copy. Run
  `localStorage.removeItem("moya-mock-db:v1:goals")` to reset.

### Demo sign-in

| Account number   | PIN     | Customer | Shows                                         |
| ---------------- | ------- | -------- | --------------------------------------------- |
| `12345678901234` | `12345` | 12345    | Full data: two years of transactions, 2 goals |
| `23456789012345` | `23456` | 23456    | Empty states: a new customer with no activity |
| `34567890123456` | `34567` | 34567    | Error states: spending endpoints return 500   |

These are defined in `src/mocks/fixtures.ts` (`MOCK_USERS`). Sign-in calls
`POST /api/auth/sign-in`; any other combination returns 401. The session is
kept in `sessionStorage`, so it ends when the tab closes.

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
  production build on a desktop and a mobile viewport. Use them for anything
  jsdom cannot do: layout, CSS, focus styles, scroll locking, colour contrast.

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

All HTTP is mocked with MSW. Default handlers live in `src/mocks/handlers.ts`.
Override them in a single test with `server.use(...)`; overrides reset after
each test. A request with no handler **fails the test**.

### Translations

- Translation keys are type-checked against `src/i18n/locales/en.json`, so a
  typo is a compile error.
- In tests, a missing key throws instead of rendering the raw key.

### Quality gates

- **Pre-commit:** lint and format staged files, run only the tests related to
  them, typecheck.
- **CI (`.github/workflows/ci.yml`):** typecheck, lint, format, unit tests with
  an 80% coverage threshold, build, and Playwright e2e. The HTML coverage report
  and, on failure, the Playwright report are uploaded as artifacts.
