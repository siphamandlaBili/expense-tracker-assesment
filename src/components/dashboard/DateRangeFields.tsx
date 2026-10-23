import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCalendar, LuChevronDown } from "react-icons/lu";
import { todayIso, type DateRange } from "../../lib/dateRange";
import { formatDayLong } from "../../lib/format";
import { RangeCalendar } from "./RangeCalendar";

type Field = "from" | "to";

type DateRangeFieldsProps = {
  /** Names the pair for screen readers, e.g. "Dates". */
  label: string;
  /** Optional note in the calendar about what the dates affect. */
  hint?: string;
  /** The dates currently in effect (shown in the fields). */
  dates?: DateRange;
  /** True when the dates are a filter the user chose (highlights the fields). */
  active: boolean;
  /** Called once both dates are set. */
  onApply: (range: DateRange) => void;
  /** Which edge of the fields the calendar lines up with. */
  align?: "left" | "right";
};

/**
 * "From" and "To" fields, each opening a calendar for that date. From can't
 * be after To and To can't be before From (those days are disabled), so the
 * range is always valid. The filter applies once both are set; picking From
 * with no To moves straight on to To.
 */
export function DateRangeFields({
  label,
  hint,
  dates,
  active,
  onApply,
  align = "right",
}: DateRangeFieldsProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Field | null>(null);
  const [start, setStart] = useState(dates?.startDate);
  const [end, setEnd] = useState(dates?.endDate);

  // When the dates change from outside (applied, cleared, a new period),
  // show those instead of anything half-picked.
  const datesKey = `${dates?.startDate}|${dates?.endDate}`;
  const [shownKey, setShownKey] = useState(datesKey);
  if (shownKey !== datesKey) {
    setShownKey(datesKey);
    setStart(dates?.startDate);
    setEnd(dates?.endDate);
  }

  // Close on Escape or a click outside the fields and calendar.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const pick = (field: Field, day: string) => {
    const nextStart = field === "from" ? day : start;
    const nextEnd = field === "to" ? day : end;
    if (field === "from") setStart(day);
    else setEnd(day);

    if (nextStart && nextEnd) {
      setOpen(null);
      onApply({ startDate: nextStart, endDate: nextEnd });
    } else {
      // Move on to the date that's still missing.
      setOpen(nextStart ? "to" : "from");
    }
  };

  const today = todayIso();

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      className="relative flex flex-wrap gap-2"
    >
      {(["from", "to"] as const).map((field) => {
        const value = field === "from" ? start : end;
        return (
          <button
            key={field}
            type="button"
            onClick={() => setOpen(open === field ? null : field)}
            aria-expanded={open === field}
            aria-haspopup="dialog"
            // Spoken as "From: 1 Sep 2024" (the visible spans have no space).
            aria-label={`${t(`dashboard.dateRange.${field}`)}: ${
              value ? formatDayLong(value) : t("dashboard.dateRange.notSet")
            }`}
            className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-1.5 text-sm transition-colors hover:border-primary ${
              active || open === field ? "border-primary" : "border-slate-200"
            }`}
          >
            <LuCalendar className="size-4 text-body" aria-hidden />
            <span className="text-body">
              {t(`dashboard.dateRange.${field}`)}:
            </span>
            <span
              className={`font-medium ${active ? "text-primary" : "text-heading"}`}
            >
              {value ? formatDayLong(value) : t("dashboard.dateRange.notSet")}
            </span>
            <LuChevronDown
              className={`size-4 text-body transition-transform ${open === field ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        );
      })}

      {open && (
        <CalendarPopover
          field={open}
          hint={hint}
          align={align}
          start={start}
          end={end}
          today={today}
          onPick={(day) => pick(open, day)}
        />
      )}
    </div>
  );
}

function CalendarPopover({
  field,
  hint,
  align,
  start,
  end,
  today,
  onPick,
}: {
  field: Field;
  hint?: string;
  align: "left" | "right";
  start?: string;
  end?: string;
  today: string;
  onPick: (day: string) => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const hintId = useId();

  // Phones: a card pinned to the bottom of the screen over a dimmed page, so
  // it always fits. From sm up: a dropdown under the fields.
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-heading/30 motion-safe:animate-fade-in sm:hidden"
      />
      <div
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={hint ? hintId : undefined}
        className={`fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl motion-safe:animate-sheet-in sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:z-30 sm:mt-2 sm:w-80 sm:motion-safe:animate-menu-in ${
          align === "left" ? "sm:left-0" : "sm:right-0"
        }`}
      >
        <h2 id={titleId} className="font-semibold text-heading">
          {field === "from"
            ? t("dashboard.dateRange.chooseStart")
            : t("dashboard.dateRange.chooseEnd")}
        </h2>
        {hint && (
          <p id={hintId} className="mt-0.5 text-xs text-body">
            {hint}
          </p>
        )}
        <div className="mt-3">
          <RangeCalendar
            // A fresh calendar per field, opening on that field's date.
            key={field}
            start={start}
            end={end}
            // From can't pass To; To can't precede From.
            max={field === "from" && end ? end : today}
            min={field === "to" ? start : undefined}
            initialFocus={field === "from" ? start : (end ?? start)}
            onPick={onPick}
          />
        </div>
      </div>
    </>
  );
}
