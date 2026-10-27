# Moya Bank: Customer Spending Insights

## About

A web dashboard where a bank customer can see where their money goes: a
summary of recent spending, monthly trends, spending by category, every
transaction, monthly budget goals and their profile.

- Built using React 19, TypeScript, Vite, Tailwind CSS, TanStack
  Query, React Router, zod and i18next. Responsive from phone to desktop, with
  accessibility checks in the test suite.

## Demo accounts

To try the app without installing anything, open the live site at
https://expense-tracker-data-mftp.vercel.app/ and sign in with any of these
accounts. They also work when you run the app yourself.

| Account number   | PIN     | Customer       | Shows                                          |
| ---------------- | ------- | -------------- | ---------------------------------------------- |
| `12345678901234` | `12345` | John Doe       | Full data: two years of transactions and goals |
| `23456789012345` | `23456` | Thandi Nkosi   | Empty states: a new customer with no activity  |
| `34567890123456` | `34567` | Pieter van Wyk | Error states: the spending service is "down"   |

## Planning

The wireframes and planning were done by hand on paper, as drawings and
handwritten notes, before the app was built. They're shared as they are, so
some of the writing may be hard to read.

- **Wireframes and planning:**
  [view the document](https://drive.google.com/file/d/1gPh6Ta6EZ8BUskdqThnIanZRGM5rDdvF/view?usp=sharing)

# How to run

### Get the code

Choose one:

- **Clone it:**
  ```sh
  git clone https://github.com/siphamandlaBili/expense-tracker-assesment.git
  cd expense-tracker-assesment
  ```
- **Fork it:** click **Fork** at the top of the
  [repository page](https://github.com/siphamandlaBili/expense-tracker-assesment),
  then clone your fork the same way, with your username in the URL.
- **Download it:** on the repository page, click **Code**, then **Download
  ZIP**. Unzip it and open a terminal in the unzipped folder.

### Locally

1. Install **Node.js 24** from https://nodejs.org, which includes npm. Check
   it with `node --version`.
2. In the project folder, install the dependencies:
   ```sh
   npm ci
   ```
3. Start the app:
   ```sh
   npm run dev
   ```
4. Open http://localhost:5173 and sign in, for example as John Doe with
   account number `12345678901234` and PIN `12345` (all accounts are in
   [Demo accounts](#demo-accounts)).

No `.env` file is needed: the app uses the hosted API by default. To point it
at a different backend, copy `.env.example` to `.env` and change
`VITE_API_BASE_URL`, then restart the dev server.

To run the production build instead of the dev server:

```sh
npm run build
npm run preview
```

Then open http://localhost:4173.

### With Docker

Requires Docker (Docker Desktop on Windows and macOS). Run these from the
project folder (see [Get the code](#get-the-code)).

Build the image:

```sh
docker build -t spending-insights .
```

Run it:

```sh
docker run --rm -p 8080:8080 spending-insights
```

Open http://localhost:8080.

# How to Test

### Landing page (`/`)

What you'll see:

- A hero section with the headline, a **Sign in to continue** button and the
  hero image.
- Four feature cards: spending trends, category insights, transaction history
  and goals.
- On phones, the header links collapse into a menu.

### Sign in

How to test:

- Click **Sign in to continue**.
- Sign in with a demo account.

What you'll see:

- Only digits can be typed: up to 14 for the account number and 5 for the PIN.
- A clear message for an empty or wrong-length field, and "Incorrect account
  number or PIN" for a wrong PIN.
- After signing in, the Overview page. The session lasts until the tab is
  closed.

### Overview (`/dashboard`)

How to test:

- Look over the page after signing in.
- Hover a slice of the category donut (desktop).
- Click a row in **Recent transactions**(view details of the transaction), then **View all**.

What you'll see:

- A greeting with your first name, which changes with the time of day.
- Four summary cards for the last 30 days: total spent, transaction count,
  average transaction and spending change, compared with the previous 30
  days. An increase is red and a decrease green, since more spending is bad
  news.
- A trend chart of the last 3 months.
- A category donut, with a legend showing each category's amount and share.
- The four most recent transactions. Clicking one opens its details: from the
  side on desktop, or as a sheet from the bottom on phones that you can drag
  taller or swipe away. **View all** opens the Transactions page.

### Spending (`/dashboard/spending`)

How to test:

- Switch between the **7 days**, **30 days**, **90 days** and **1 year**
  buttons.
- Change the trend length (3 to 24 months).
- In **Category breakdown**, toggle the category chips and pick custom
  **From** and **To** dates.

What you'll see:

- The period buttons update the summary (total, transactions, average, top
  category, change vs the previous period) and the category breakdown.
- The trend chart redraws for the chosen number of months.
- The chips show or hide categories in the breakdown. Custom dates replace
  the period for that card only.
- Filters are kept in the URL, so a reload or a shared link keeps the same
  view.

### Transactions (`/dashboard/transactions`)

How to test:

- Filter by a category, pick a date range, and change **Sort by**.
- Change **Rows per page** (10, 20 or 50), and use the previous and next page
  buttons.
- Click anywhere on a transaction row to open its details, then close them.
- Click **Clear filters**.

What you'll see:

- A paged table of date, merchant, category, payment method and amount, with
  "Showing 1–10 of …" and the page number. On phones, the least important
  columns are dropped so nothing scrolls sideways.
- Every filter change updates the table straight away and goes back to page
  1, and the totals update.
- Every row is clickable, with a hover highlight. Clicking one opens a details
  drawer with the full transaction (merchant and amount, then date and time,
  category, description, payment method and reference): from the side on
  desktop, or as a sheet from the bottom on phones that you can drag taller
  or swipe away.
- **Clear filters** returns to all transactions, newest first.
- The filters and page are saved in the URL, so a reload or shared link shows
  the same view.

### Goals (`/dashboard/goals`)

How to test:

- Click **Create goal**, choose a category, and enter a monthly budget. Try an
  empty value or `0` first.
- Click a goal card, then **Edit budget**, change the amount and save.
- Open a goal and click **Delete goal**, then **Cancel**, then delete it for
  real.

What you'll see:

- One card per goal with this month's spending, a progress bar, days left and
  a status: **On track**, **Warning** (80% or more) or **Over budget**.
- Only categories without a goal are offered when creating one, and an
  invalid budget shows a message under the field.
- After saving an edit, the drawer closes and the card shows the new budget.
- Deleting asks for confirmation over the drawer. **Cancel** returns to the
  drawer, and confirming removes the goal.

### Profile (`/dashboard/profile`)

How to test:

- Open **Profile** from the navigation or the avatar menu.

What you'll see:

- Your name, email and account type, plus total spent since joining, customer
  ID, member since date and currency (e.g. "South African Rand (ZAR)").

### Empty and error states

How to test:

- Sign out, then sign in as **Thandi Nkosi** (`23456789012345` / `23456`).
- Sign out, then sign in as **Pieter van Wyk** (`34567890123456` / `34567`).

What you'll see:

- **Thandi:** every page loads with a friendly empty message instead of
  charts and tables, such as "No transactions yet" and "You haven't set any
  goals yet".
- **Pieter:** the profile and navigation work, but every spending card shows
  "We couldn't load this" with a **Try again** button.

### Currency

- The currency comes from the API: each customer's profile has a `currency`
  code (all demo accounts use `ZAR`). Nothing in the app assumes rand.

## Automated tests

```sh
npm run lint            # ESLint, fails on any warning
npm run typecheck       # TypeScript, app and tests
npm run test:coverage   # Unit and component tests, 80% coverage minimum
npx playwright install chromium   # first time only
npm run test:e2e        # Playwright, desktop and phone, against the production build
```

- **Unit and component tests** (Vitest and Testing Library) never touch the
  network: a fake API in `src/test/fakeApi` serves seeded data for a fixed
  date, so results are the same on every run. They include automated
  accessibility checks (axe).
- **End-to-end tests** (Playwright) run the real app against the live API on
  a desktop and a phone viewport, covering layout, navigation, drawers and
  accessibility.
- **CI** (`.github/workflows/ci.yml`) runs all of the above on every push to
  `main` and every pull request, and builds and smoke-tests the Docker image.
