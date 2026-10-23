import { useEffect, useRef, useState } from "react";

/**
 * Open state for a button + panel dropdown (account menu, notifications).
 * Closes on Escape (returning focus to the button) or a click outside the
 * root, which also means opening one dropdown closes any other.
 */
export function useDropdown() {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return {
    open,
    rootRef,
    buttonRef,
    toggle: () => setOpen((value) => !value),
    close: () => setOpen(false),
  };
}
