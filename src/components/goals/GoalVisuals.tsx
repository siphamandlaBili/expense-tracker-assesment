import { useTranslation } from "react-i18next";
import type { Goal, GoalStatus } from "../../api/schemas";
import { goalPercent } from "./goalFormat";

// Status colours back up the status text; they never stand alone.
const STATUS_STYLE: Record<GoalStatus, { badge: string; bar: string }> = {
  on_track: { badge: "bg-green-50 text-green-700", bar: "bg-primary" },
  warning: { badge: "bg-amber-50 text-amber-800", bar: "bg-amber-500" },
  exceeded: { badge: "bg-red-50 text-red-700", bar: "bg-red-600" },
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status].badge}`}
    >
      {t(`goals.status.${status}`)}
    </span>
  );
}

/** Budget used, as an accessible progress bar (capped at full). */
export function GoalProgress({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  return (
    <div
      role="progressbar"
      aria-label={t("goals.card.progressLabel", { category: goal.category })}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(Math.round(goal.percentageUsed), 100)}
      aria-valuetext={t("goals.card.progressValue", {
        percent: goalPercent(goal),
      })}
      className="h-2 overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${STATUS_STYLE[goal.status].bar}`}
        style={{ width: `${Math.min(goal.percentageUsed, 100)}%` }}
      />
    </div>
  );
}
