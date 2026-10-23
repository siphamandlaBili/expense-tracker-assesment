import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectProps<T extends string | number> = {
  label: string;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** Open the list above the button (e.g. near the bottom of the page). */
  placement?: "bottom" | "top";
  /** Which edge the list lines up with. */
  align?: "left" | "right";
};

/**
 * A styled dropdown following the WAI-ARIA "select-only combobox" pattern:
 * focus stays on the button, the highlighted option is announced through
 * aria-activedescendant, and it works fully from the keyboard.
 */
export function Select<T extends string | number>({
  label,
  hideLabel = false,
  value,
  options,
  onChange,
  placement = "bottom",
  align = "left",
}: SelectProps<T>) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [active, setActive] = useState(selectedIndex);

  // Close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Keep the highlighted option in view while moving through a long list.
  useEffect(() => {
    if (open) {
      document
        .getElementById(optionId(active))
        ?.scrollIntoView?.({ block: "nearest" });
    }
  });

  const openAt = (index: number) => {
    setActive(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    const keys: Record<string, () => void> = open
      ? {
          ArrowDown: () => setActive((i) => Math.min(i + 1, last)),
          ArrowUp: () => setActive((i) => Math.max(i - 1, 0)),
          Home: () => setActive(0),
          End: () => setActive(last),
          Enter: () => choose(active),
          " ": () => choose(active),
          Escape: () => setOpen(false),
          Tab: () => setOpen(false),
        }
      : {
          ArrowDown: () => openAt(selectedIndex),
          ArrowUp: () => openAt(selectedIndex),
          Enter: () => openAt(selectedIndex),
          " ": () => openAt(selectedIndex),
          Home: () => openAt(0),
          End: () => openAt(last),
        };

    const action = keys[event.key];
    if (action) {
      // Tab must still move focus on.
      if (event.key !== "Tab") event.preventDefault();
      // Escape closes only the list, not a dialog the Select sits in.
      if (open && event.key === "Escape") event.stopPropagation();
      action();
      return;
    }

    // Typing a letter jumps to the next option starting with it.
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const from = open ? active : selectedIndex;
      const char = event.key.toLowerCase();
      const order = [...options.slice(from + 1), ...options.slice(0, from + 1)];
      const match = order.find((option) =>
        option.label.toLowerCase().startsWith(char),
      );
      if (match) {
        const index = options.indexOf(match);
        if (open) setActive(index);
        else onChange(match.value);
      }
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <span
        id={labelId}
        className={
          hideLabel ? "sr-only" : "mb-1 block text-xs font-medium text-body"
        }
      >
        {label}
      </span>
      <button
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={handleKeyDown}
        className={`flex w-full min-w-28 items-center justify-between gap-2 rounded-xl border bg-white px-3 py-1.5 text-left text-sm font-medium text-heading outline-none transition-colors hover:border-primary focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary ${
          open ? "border-primary" : "border-slate-200"
        }`}
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <LuChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-body transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        hidden={!open}
        className={`absolute z-30 max-h-[70vh] min-w-full overflow-auto rounded-xl border border-slate-200/80 bg-white p-1 shadow-xl motion-safe:animate-menu-in ${
          placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
        } ${align === "right" ? "right-0" : "left-0"}`}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={selected}
              // Keep focus on the button so keyboard handling stays there.
              onPointerDown={(event) => event.preventDefault()}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                index === active
                  ? "bg-primary-light text-primary"
                  : "text-heading"
              } ${selected ? "font-semibold" : ""}`}
            >
              {option.label}
              {selected && (
                <LuCheck aria-hidden className="size-4 text-primary" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
