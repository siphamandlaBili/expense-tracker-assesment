import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";
import { preloadDashboardPages } from "../app/pages";
import { fakeApi, fakeFetch, resetDb } from "./fakeApi";
import { TEST_NOW } from "./constants";
import "./i18n";

// findBy*/waitFor wait up to 4s: page tests chain sign-in, navigation and
// several requests before the asserted content appears.
configure({ asyncUtilTimeout: 4000 });

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

// Pages are code-split; loading them up front lets tests assert on a page
// as soon as it renders, without waiting out the Suspense fallback.
beforeAll(() => preloadDashboardPages());

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  // Every API call goes to the fake API (src/test/fakeApi), never the network.
  vi.stubGlobal("fetch", fakeFetch);
  resetDb({ now: TEST_NOW });
});

afterEach(() => {
  cleanup();
  fakeApi.reset();
});
