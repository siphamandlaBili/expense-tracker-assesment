import { describe, expect, it } from "vitest";
import { fakeApi, http } from "../test/fakeApi";
import { z } from "zod";
import { ApiError, apiRequest } from "./client";

describe("apiRequest", () => {
  it("builds the URL with only the defined query parameters", async () => {
    let requestedUrl = "";
    fakeApi.use(
      http.get("*/api/ping", ({ request }) => {
        requestedUrl = request.url;
        return Response.json({ ok: true });
      }),
    );

    await apiRequest("/ping", {
      query: { a: "1", b: undefined, c: "", d: 2 },
      schema: z.object({ ok: z.boolean() }),
    });

    const url = new URL(requestedUrl);
    expect(url.pathname).toBe("/api/ping");
    expect(Object.fromEntries(url.searchParams)).toEqual({ a: "1", d: "2" });
  });

  it("sends JSON bodies", async () => {
    let received: unknown;
    fakeApi.use(
      http.post("*/api/echo", async ({ request }) => {
        received = await request.json();
        return new Response(null, { status: 204 });
      }),
    );

    await apiRequest("/echo", { method: "POST", body: { value: 1 } });

    expect(received).toEqual({ value: 1 });
  });

  it("throws ApiError with the server's message", async () => {
    fakeApi.use(
      http.get("*/api/broken", () =>
        Response.json({ message: "Something broke" }, { status: 503 }),
      ),
    );

    const error = await apiRequest("/broken").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503, message: "Something broke" });
  });

  it("falls back to the status text when the error body isn't JSON", async () => {
    fakeApi.use(
      http.get(
        "*/api/html-error",
        () =>
          new Response("<h1>Bad gateway</h1>", {
            status: 502,
            statusText: "Bad Gateway",
          }),
      ),
    );

    await expect(apiRequest("/html-error")).rejects.toMatchObject({
      status: 502,
      message: "Bad Gateway",
    });
  });

  it("rejects responses that don't match the schema", async () => {
    fakeApi.use(
      http.get("*/api/shape", () => Response.json({ total: "lots" })),
    );

    await expect(
      apiRequest("/shape", { schema: z.object({ total: z.number() }) }),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});
