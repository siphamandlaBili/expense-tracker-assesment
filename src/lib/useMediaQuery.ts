import { useSyncExternalStore } from "react";

/** Whether a CSS media query matches; re-renders when it changes. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    // No matchMedia (e.g. jsdom): treat as not matching.
    () => window.matchMedia?.(query).matches ?? false,
  );
}
