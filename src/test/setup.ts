import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { resetDb } from "../mocks/db";
import { server } from "../mocks/server";
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

// Any request without a matching MSW handler fails the test.
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetDb({ now: TEST_NOW, fresh: true });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
