import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** Tallest the sheet can be, as a fraction of the viewport height. */
const MAX_FRACTION = 0.92;
/** Used when the content can't be measured (e.g. jsdom). */
const FALLBACK_FRACTION = 0.5;
/** Two snap points closer than this (px) are treated as one. */
const MIN_SNAP_GAP = 24;

/** Pixels the pointer must move before a press becomes a drag. */
const DRAG_THRESHOLD = 4;
/** How far ahead (ms) to project a flick when choosing where to settle. */
const FLICK_PROJECTION_MS = 180;
/** Below this fraction of the lowest snap point, letting go dismisses. */
const DISMISS_RATIO = 0.6;

/**
 * Snap heights in px, lowest first. The lowest fits the content exactly
 * (so it always shows everything); the highest is MAX_FRACTION of the
 * viewport, offered only when the content is shorter than that.
 */
function snapHeights(contentHeight: number) {
  const max = window.innerHeight * MAX_FRACTION;
  const fit =
    contentHeight > 0
      ? Math.min(contentHeight, max)
      : window.innerHeight * FALLBACK_FRACTION;
  return max - fit < MIN_SNAP_GAP ? [fit] : [fit, max];
}

/** Index of the snap height closest to `height`. */
const nearestSnap = (snaps: number[], height: number) =>
  snaps.reduce(
    (best, snap, i) =>
      Math.abs(snap - height) < Math.abs(snaps[best] - height) ? i : best,
    0,
  );

/**
 * Drag-to-resize behaviour for a bottom sheet: the sheet follows the pointer
 * and, on release, settles on the nearest snap point (taking flick velocity
 * into account) or dismisses when pulled low enough.
 *
 * Moves are tracked on the window from the moment of the press, so the drag
 * keeps working however far or fast the pointer travels, and buttons inside
 * the drag area still receive ordinary clicks.
 */
export function useBottomSheet({
  enabled,
  contentHeight,
  onDismiss,
}: {
  enabled: boolean;
  /** Natural height of everything in the sheet; 0 if unknown. */
  contentHeight: number;
  onDismiss: () => void;
}) {
  const [snapIndex, setSnapIndex] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const stopTracking = useRef<(() => void) | null>(null);

  // Stop listening if the sheet unmounts mid-drag.
  useEffect(() => () => stopTracking.current?.(), []);

  const snaps = snapHeights(contentHeight);
  const index = Math.min(snapIndex, snaps.length - 1);
  const height = dragHeight ?? snaps[index];
  const expanded = index === snaps.length - 1;

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) return;
    stopTracking.current?.();

    const { pointerId } = event;
    const startY = event.clientY;
    const startHeight = height;
    let lastY = startY;
    let lastTime = performance.now();
    let velocity = 0; // px per ms; positive is downward
    let dragging = false;

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const distance = moveEvent.clientY - startY;
      if (!dragging && Math.abs(distance) < DRAG_THRESHOLD) return;
      dragging = true;

      const now = performance.now();
      velocity = (moveEvent.clientY - lastY) / Math.max(now - lastTime, 1);
      lastY = moveEvent.clientY;
      lastTime = now;

      const max = snaps[snaps.length - 1];
      setDragHeight(Math.min(Math.max(startHeight - distance, 0), max));
    };

    const end = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      stop();
      if (!dragging) return;

      const released = startHeight - (endEvent.clientY - startY);
      const projected = released - velocity * FLICK_PROJECTION_MS;
      setDragHeight(null);

      if (projected < snaps[0] * DISMISS_RATIO) onDismiss();
      else setSnapIndex(nearestSnap(snaps, projected));
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      stopTracking.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    stopTracking.current = stop;
  };

  return {
    /** Inline height for the sheet, or undefined when disabled. */
    height: enabled ? height : undefined,
    /** True while following the pointer: disable the height transition. */
    dragging: dragHeight !== null,
    /** False when the content already fills the tallest snap point. */
    canExpand: snaps.length > 1,
    expanded,
    toggle: () => setSnapIndex(expanded ? 0 : snaps.length - 1),
    /** Spread on the drag area (handle and title bar). */
    dragHandlers: { onPointerDown },
  };
}
