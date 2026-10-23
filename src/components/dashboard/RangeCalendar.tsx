import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {
  addDays,
  addMonths,
  calendarWeeks,
  shiftMonths,
  startOfMonth,
  weekdayIndex,
} from "../../lib/dateRange";
import { formatDayLong, formatMonthLong } from "../../lib/format";

type RangeCalendarProps = {
  start?: string;
  end?: string;
  /** Latest selectable day (YYYY-MM-DD); later days are disabled. */
  max: string;
  /** Earliest selectable day; earlier days are disabled. */
  min?: string;
  /** Day to open on and focus (defaults to `start`, then `max`). */
  initialFocus?: string;
  /** Called with each day picked; the parent decides start vs. end. */
  onPick: (day: string) => void;
};

// Monday-first weekday headers, from a known Monday (1 Jan 2024).
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(Date.UTC(2024, 0, 1 + i));
  const name = (weekday: "short" | "long") =>
    new Intl.DateTimeFormat("en-US", { weekday, timeZone: "UTC" }).format(date);
  return { short: name("short").slice(0, 2), long: name("long") };
});

/**
 * Month grid for picking a date within a range (WAI-ARIA date picker grid): one Tab
 * stop, arrow keys move by day and week, PageUp/PageDown by month, Home/End
 * to the start/end of the week, Enter or Space picks.
 */
export function RangeCalendar({
  start,
  end,
  max,
  min,
  initialFocus,
  onPick,
}: RangeCalendarProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const gridRef = useRef<HTMLTableElement>(null);
  // Keep a day within the selectable range.
  const clamp = (day: string) =>
    day > max ? max : min && day < min ? min : day;
  const [focused, setFocused] = useState(() =>
    clamp(initialFocus ?? start ?? max),
  );
  const [month, setMonth] = useState(() => startOfMonth(focused));
  const [hovered, setHovered] = useState<string | undefined>();
  // Move DOM focus only after keyboard navigation (and on first render).
  const moveFocus = useRef(true);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)
      ?.focus({ preventScroll: true });
  }, [focused]);

  const focusDay = (day: string) => {
    const next = clamp(day);
    moveFocus.current = true;
    setFocused(next);
    setMonth(startOfMonth(next));
  };

  const showMonth = (offset: number) => {
    const next = addMonths(month, offset);
    setMonth(next);
    // Keep the focusable day inside the visible month.
    const day = shiftMonths(focused, offset);
    setFocused(clamp(day));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
      PageUp: () => shiftMonths(focused, -1),
      PageDown: () => shiftMonths(focused, 1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      focusDay(move());
    }
  };

  // While choosing the end, preview the range up to the hovered day.
  const rangeEnd =
    end ?? (start && hovered && hovered >= start ? hovered : start);
  const inRange = (day: string) =>
    Boolean(start && rangeEnd && day >= start && day <= rangeEnd);
  const isEdge = (day: string) => day === start || day === end;
  const nextDisabled = addMonths(month, 1) > max;
  const previousDisabled = Boolean(min && month <= startOfMonth(min));
  const isDisabled = (day: string) => day > max || Boolean(min && day < min);

  const navButton =
    "rounded-full p-1.5 text-body hover:bg-dashboard hover:text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => showMonth(-1)}
          disabled={previousDisabled}
          aria-label={t("dashboard.dateRange.previousMonth")}
          className={navButton}
        >
          <LuChevronLeft className="size-4" aria-hidden />
        </button>
        <h3
          id={headingId}
          aria-live="polite"
          className="text-sm font-semibold text-heading"
        >
          {formatMonthLong(month.slice(0, 7))}
        </h3>
        <button
          type="button"
          onClick={() => showMonth(1)}
          disabled={nextDisabled}
          aria-label={t("dashboard.dateRange.nextMonth")}
          className={navButton}
        >
          <LuChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={headingId}
        onKeyDown={handleKeyDown}
        onPointerLeave={() => setHovered(undefined)}
        className="w-full border-collapse text-center text-sm"
      >
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday.long}
                scope="col"
                abbr={weekday.long}
                className="pb-1 text-xs font-medium text-body"
              >
                {weekday.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks(month).map((week) => (
            <tr key={week.find(Boolean) ?? ""}>
              {week.map((day, index) =>
                day ? (
                  <td
                    key={day}
                    role="gridcell"
                    aria-selected={inRange(day)}
                    className={`p-0 ${inRange(day) && !isEdge(day) ? "bg-primary-light" : ""} ${
                      day === start && rangeEnd && rangeEnd > day
                        ? "rounded-l-full bg-primary-light"
                        : ""
                    } ${day === rangeEnd && start && start < day ? "rounded-r-full bg-primary-light" : ""}`}
                  >
                    <button
                      type="button"
                      data-day={day}
                      tabIndex={day === focused ? 0 : -1}
                      disabled={isDisabled(day)}
                      aria-label={formatDayLong(day)}
                      aria-current={day === max ? "date" : undefined}
                      onClick={() => {
                        setFocused(day);
                        onPick(day);
                      }}
                      onPointerEnter={() => setHovered(day)}
                      className={`mx-auto flex size-9 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:text-slate-300 ${
                        isEdge(day)
                          ? "bg-primary font-semibold text-white"
                          : "text-heading hover:bg-dashboard"
                      } ${day === max && !isEdge(day) ? "font-semibold text-primary" : ""}`}
                    >
                      {Number(day.slice(8, 10))}
                    </button>
                  </td>
                ) : (
                  // Days outside the month.
                  <td key={`empty-${index}`} role="gridcell" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
