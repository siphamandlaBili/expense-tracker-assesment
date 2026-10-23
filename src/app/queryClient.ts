import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Client errors (4xx) won't succeed on retry; network and 5xx might.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) &&
          failureCount < 2,
      },
    },
  });
}
