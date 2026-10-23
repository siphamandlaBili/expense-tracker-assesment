import { useCallback, useEffect, useRef, useState } from "react";

/** Length of every "out" animation in App.css (sheet, panel, nav, menu). */
export const EXIT_ANIMATION_MS = 200;

/** No matchMedia (e.g. jsdom) means we can't animate reliably: skip it. */
export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true;

/**
 * Open/close state for something with an exit animation (a menu or drawer).
 * `mounted` stays true while it animates out (`closing`), then turns false.
 * With reduced motion it closes at once.
 */
export function useAnimatedPresence() {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(false);
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    if (prefersReducedMotion()) {
      setMounted(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_ANIMATION_MS);
  }, []);

  /** Open, and not on its way out. */
  const isOpen = mounted && !closing;

  return {
    mounted,
    closing,
    isOpen,
    open,
    close,
    toggle: isOpen ? close : open,
  };
}
