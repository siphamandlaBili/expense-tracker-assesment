import { handlers } from "./handlers";
import type { Route } from "./routes";

export { http } from "./routes";
export { resetDb } from "./db";

// An in-process stand-in for the spending API, installed as `fetch` in unit
// tests (src/test/setup.ts). Tests never reach the network: every request is
// answered by `handlers`, which behave like the real API over seeded data,
// or by a per-test override from `fakeApi.use(...)`.

let overrides: Route[] = [];
let listeners: ((request: Request) => void)[] = [];

export const fakeApi = {
  /** Overrides matching routes for the current test (reset afterwards). */
  use(...routes: Route[]) {
    overrides = [...routes, ...overrides];
  },
  /** Calls `listener` with every request, e.g. to check query parameters. */
  onRequest(listener: (request: Request) => void) {
    listeners.push(listener);
  },
  reset() {
    overrides = [];
    listeners = [];
  },
};

export async function fakeFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  // The signal stays out of the Request: jsdom's AbortSignal isn't the one
  // Node's Request accepts.
  const { signal, ...rest } = init;
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const request = new Request(input, rest);
  for (const listener of listeners) listener(request);

  const url = new URL(request.url);
  const target = `${url.origin}${url.pathname}`;
  for (const route of [...overrides, ...handlers]) {
    if (route.method !== request.method) continue;
    const match = route.pattern.exec(target);
    if (!match) continue;
    const params = Object.fromEntries(
      route.paramNames.map((name, index) => [
        name,
        decodeURIComponent(match[index + 1]),
      ]),
    );
    return route.resolver({ request, params });
  }

  // Like a network failure, so the test sees it; logged to explain why.
  const message = `No fake API route for ${request.method} ${request.url}`;
  console.error(message);
  throw new TypeError(message);
}
