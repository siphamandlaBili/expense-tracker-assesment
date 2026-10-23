import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../mocks/server";
import { apiRequest } from "./client";
import { setMockReady } from "./mockGate";

describe("mock gate", () => {
  it("holds API requests until the mock is ready", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/gate", () => {
        calls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    let finishStarting = () => {};
    setMockReady(new Promise<void>((resolve) => (finishStarting = resolve)));

    const request = apiRequest("/gate");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toBe(0);

    finishStarting();
    await request;
    expect(calls).toBe(1);
  });

  it("lets requests through if the mock fails to start", async () => {
    server.use(
      http.get("*/api/gate", () => new HttpResponse(null, { status: 204 })),
    );
    setMockReady(Promise.reject(new Error("no service worker")));

    await expect(apiRequest("/gate")).resolves.toBeUndefined();
    setMockReady(Promise.resolve());
  });
});
