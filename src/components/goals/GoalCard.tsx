import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { Goal } from "../../api/schemas";
import { formatCurrency } from "../../lib/format";
import { CategoryBadge } from "../dashboard/CategoryBadge";
import { goalPercent } from "./goalFormat";
import { GoalProgress, GoalStatusBadge } from "./GoalVisuals";

type GoalCardProps = {
  goal: Goal;
  /** Icon name from /filters for the goal's category. */
  icon: string;
  currency?: string;
  /** Opens the goal's details drawer. */
  onOpen: () => void;
};

/**
 * One monthly budget: status, days left, spend so far and a progress bar.
 * The whole card opens the details drawer; the category name is the button
 * (stretched over the card) for keyboard and screen-reader users.
 */
export function GoalCard({ goal, icon, currency, onOpen }: GoalCardProps) {
  const { t } = useTranslation();
  const nameId = useId();

  return (
    <article
      aria-labelledby={nameId}
      className="relative rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors focus-within:border-primary hover:border-primary sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryBadge category={goal.category} icon={icon} />
          <div className="min-w-0">
            <h2 className="font-semibold text-heading">
              <button
                type="button"
                onClick={onOpen}
                className="text-left outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
              >
                <span id={nameId}>{goal.category}</span>
                <span className="sr-only">, {t("goals.card.viewDetails")}</span>
              </button>
            </h2>
            <p className="text-sm text-body">
              {t("goals.card.monthlyBudget", {
                amount: formatCurrency(goal.monthlyBudget, currency),
              })}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <GoalStatusBadge status={goal.status} />
          <p className="mt-1 text-xs text-body">
            {t("goals.card.daysLeft", { count: goal.daysRemaining })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-3 text-sm">
        <span className="text-body">
          {t("goals.card.spent", {
            amount: formatCurrency(goal.currentSpent, currency),
          })}
        </span>
        <span className="font-medium text-heading">{goalPercent(goal)}</span>
      </div>
      <div className="mt-2">
        <GoalProgress goal={goal} />
      </div>
    </article>
  );
}
