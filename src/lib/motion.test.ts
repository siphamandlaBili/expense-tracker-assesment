import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXIT_ANIMATION_MS, useAnimatedPresence } from "./motion";

const allowMotion = () =>
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

describe("useAnimatedPresence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays mounted while the exit animation plays, then unmounts", () => {
    allowMotion();
    const { result } = renderHook(() => useAnimatedPresence());

    act(() => result.current.open());
    expect(result.current).toMatchObject({
      mounted: true,
      closing: false,
      isOpen: true,
    });

    act(() => result.current.close());
    expect(result.current).toMatchObject({
      mounted: true,
      closing: true,
      isOpen: false,
    });

    act(() => vi.advanceTimersByTime(EXIT_ANIMATION_MS));
    expect(result.current).toMatchObject({ mounted: false, closing: false });
  });

  it("reopening during the exit animation cancels it", () => {
    allowMotion();
    const { result } = renderHook(() => useAnimatedPresence());

    act(() => result.current.open());
    act(() => result.current.close());
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(EXIT_ANIMATION_MS));

    expect(result.current).toMatchObject({ mounted: true, isOpen: true });
  });

  it("closes at once when motion is reduced", () => {
    const { result } = renderHook(() => useAnimatedPresence());

    act(() => result.current.open());
    act(() => result.current.toggle());

    expect(result.current.mounted).toBe(false);
  });
});
