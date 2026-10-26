import type { z } from "zod";
import { API_BASE_URL } from "./config";
import { apiErrorBodySchema } from "./schemas";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryValue = string | number | undefined;

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Omit for endpoints that return no content. */
  schema?: z.ZodType<T>;
};

function buildUrl(path: string, query: Record<string, QueryValue> = {}) {
  // Resolving against the page origin also allows a relative base (/api).
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export async function apiRequest<T = void>(
  path: string,
  { method = "GET", query, body, signal, schema }: RequestOptions<T> = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    method,
    signal,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = apiErrorBodySchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new ApiError(
      response.status,
      errorBody.success ? errorBody.data.message : response.statusText,
    );
  }

  if (!schema) return undefined as T;
  return schema.parse(await response.json());
}
