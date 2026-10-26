import { z } from "zod";
import { API_BASE_URL } from "../../api/config";
import {
  createGoalInputSchema,
  isoDateSchema,
  periodSchema,
  sortBySchema,
  updateGoalInputSchema,
} from "../../api/schemas";
import {
  categoryBreakdown,
  customRange,
  describeRange,
  goalProgress,
  inRange,
  monthlyTrends,
  periodRange,
  queryTransactions,
  spendingSummary,
  sum,
} from "./compute";
import { customerDb, now, type CustomerDb } from "./db";
import {
  categoriesFixture,
  dateRangePresetsFixture,
  findUser,
  MOCK_USERS,
  type MockUser,
  type StoredGoal,
} from "./fixtures";
import { http, type Route } from "./routes";

// Fake spending API for unit tests, mirroring the real API: validates input,
// returns 400/401/404/409 errors, and derives every figure from one seeded
// transaction history. Which data a customer gets depends on their scenario
// in MOCK_USERS. Override per test with `fakeApi.use(...)`.

const BASE = `${API_BASE_URL}/customers/:customerId`;

const error = (status: number, message: string) =>
  Response.json({ message }, { status });

const queryParams = (request: Request) =>
  Object.fromEntries(new URL(request.url).searchParams);

type ResolverArgs<P> = {
  request: Request;
  params: P;
  user: MockUser;
  store: CustomerDb;
};

/**
 * Wraps a resolver with the customer lookup and the "error" scenario.
 * `failInErrorScenario: false` keeps an endpoint working for that customer
 * (the profile, so the dashboard shell can still render).
 */
function forCustomer<P extends Record<string, string>>(
  resolver: (args: ResolverArgs<P>) => Response | Promise<Response>,
  { failInErrorScenario = true } = {},
) {
  return async ({
    request,
    params,
  }: {
    request: Request;
    params: Record<string, string>;
  }) => {
    const user = findUser(String(params.customerId));
    if (!user) {
      return error(404, `Customer ${String(params.customerId)} not found`);
    }
    if (failInErrorScenario && user.scenario === "error") {
      return error(500, "The spending service is temporarily unavailable");
    }
    return resolver({
      request,
      params: params as P,
      user,
      store: customerDb(user.customerId),
    });
  };
}

/** Parses with `schema`, or returns a 400 response describing the problem. */
function parse<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  return result.success
    ? { data: result.data, response: null }
    : { data: null, response: error(400, z.prettifyError(result.error)) };
}

const signInBodySchema = z.object({
  accountNumber: z.string(),
  pin: z.string(),
});

const periodQuerySchema = z.object({
  period: periodSchema.default("30d"),
});

const categoriesQuerySchema = z
  .object({
    period: periodSchema.default("30d"),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    { error: "startDate must be on or before endDate" },
  );

const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(12),
});

const knownCategory = z
  .string()
  .refine((name) => categoriesFixture.some((c) => c.name === name), {
    error: "Unknown category",
  });

const transactionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    category: knownCategory.optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    sortBy: sortBySchema.default("date_desc"),
  })
  .refine(
    ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
    { error: "startDate must be on or before endDate" },
  );

const createGoalBodySchema = createGoalInputSchema.extend({
  category: knownCategory,
});

const goalResponse = (store: CustomerDb, goal: StoredGoal) =>
  goalProgress(goal, store.transactions(), now());

export const handlers: Route[] = [
  http.post(`${API_BASE_URL}/auth/sign-in`, async ({ request }) => {
    const { data, response } = parse(
      signInBodySchema,
      await request.json().catch(() => null),
    );
    if (response) return response;

    const user = MOCK_USERS.find(
      (candidate) =>
        candidate.accountNumber === data.accountNumber &&
        candidate.pin === data.pin,
    );
    if (!user) return error(401, "Incorrect account number or PIN");

    return Response.json({
      customerId: user.customerId,
      name: user.profile.name,
    });
  }),

  http.get(
    `${BASE}/profile`,
    forCustomer(
      ({ user, store }) =>
        Response.json({
          customerId: user.customerId,
          ...user.profile,
          totalSpent: sum(store.transactions()),
        }),
      { failInErrorScenario: false },
    ),
  ),

  http.get(
    `${BASE}/spending/summary`,
    forCustomer(({ request, store }) => {
      const { data, response } = parse(periodQuerySchema, queryParams(request));
      if (response) return response;

      return Response.json(
        spendingSummary(
          store.transactions(),
          categoriesFixture,
          data.period,
          now(),
        ),
      );
    }),
  ),

  http.get(
    `${BASE}/spending/categories`,
    forCustomer(({ request, store }) => {
      const { data, response } = parse(
        categoriesQuerySchema,
        queryParams(request),
      );
      if (response) return response;

      const range =
        data.startDate && data.endDate
          ? customRange(data.startDate, data.endDate)
          : periodRange(data.period, now());

      return Response.json({
        dateRange: describeRange(range),
        ...categoryBreakdown(
          inRange(store.transactions(), range),
          categoriesFixture,
        ),
      });
    }),
  ),

  http.get(
    `${BASE}/spending/trends`,
    forCustomer(({ request, store }) => {
      const { data, response } = parse(trendsQuerySchema, queryParams(request));
      if (response) return response;

      return Response.json({
        trends: monthlyTrends(store.transactions(), data.months, now()),
      });
    }),
  ),

  http.get(
    `${BASE}/transactions`,
    forCustomer(({ request, store }) => {
      const { data, response } = parse(
        transactionsQuerySchema,
        queryParams(request),
      );
      if (response) return response;

      return Response.json(queryTransactions(store.transactions(), data));
    }),
  ),

  http.get(
    `${BASE}/goals`,
    forCustomer(({ store }) =>
      Response.json({
        goals: store.goals().map((goal) => goalResponse(store, goal)),
      }),
    ),
  ),

  http.post(
    `${BASE}/goals`,
    forCustomer(async ({ request, store }) => {
      const { data, response } = parse(
        createGoalBodySchema,
        await request.json().catch(() => null),
      );
      if (response) return response;

      if (store.goals().some((goal) => goal.category === data.category)) {
        return error(409, `A goal for ${data.category} already exists`);
      }
      return Response.json(goalResponse(store, store.createGoal(data)), {
        status: 201,
      });
    }),
  ),

  http.patch(
    `${BASE}/goals/:goalId`,
    forCustomer<{ goalId: string }>(async ({ request, params, store }) => {
      const { data, response } = parse(
        updateGoalInputSchema,
        await request.json().catch(() => null),
      );
      if (response) return response;

      const updated = store.updateGoal(params.goalId, data);
      return updated
        ? Response.json(goalResponse(store, updated))
        : error(404, `Goal ${params.goalId} not found`);
    }),
  ),

  http.delete(
    `${BASE}/goals/:goalId`,
    forCustomer<{ goalId: string }>(({ params, store }) =>
      store.deleteGoal(params.goalId)
        ? new Response(null, { status: 204 })
        : error(404, `Goal ${params.goalId} not found`),
    ),
  ),

  http.get(
    `${BASE}/filters`,
    forCustomer(() =>
      Response.json({
        categories: categoriesFixture,
        dateRangePresets: dateRangePresetsFixture,
      }),
    ),
  ),
];
