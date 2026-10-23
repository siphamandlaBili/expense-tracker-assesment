import { useEffect, useRef, type RefObject } from "react";

// Open modals, oldest first. Only the topmost reacts to Escape, so a popup
// over a drawer closes on its own.
const stack: symbol[] = [];
// Scroll stays locked until the last modal closes.
let scrollLocks = 0;

/**
 * Shared behaviour for popups and drawers while they are mounted: focus
 * `initialFocus`, lock page scroll, close on Escape (topmost only), and hand
 * focus back to whatever had it before when the popup closes. Focus moves
 * never scroll the page, so the content behind doesn't jump.
 */
export function useModal(
  onClose: () => void,
  initialFocus: RefObject<HTMLElement | null>,
) {
  // The latest onClose, without re-running the effect (which would reorder
  // the stack and move focus) when the caller passes a new function.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const id = Symbol("modal");
    stack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    initialFocus.current?.focus({ preventScroll: true });
    scrollLocks += 1;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && stack[stack.length - 1] === id) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      stack.splice(stack.indexOf(id), 1);
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = "";
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [initialFocus]);
}
