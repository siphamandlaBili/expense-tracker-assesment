import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import type { Goal } from "../../api/schemas";
import { formatCurrency } from "../../lib/format";
import { CategoryBadge } from "../dashboard/CategoryBadge";
import { Drawer, DrawerDetails } from "../dashboard/Drawer";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "../dashboard/formStyles";
import { BudgetField } from "./BudgetField";
import { goalPercent } from "./goalFormat";
import { parseBudget, type GoalFormErrorKey } from "./goalSchema";
import { GoalProgress, GoalStatusBadge } from "./GoalVisuals";

type GoalDrawerProps = {
  goal: Goal;
  icon: string;
  currency?: string;
  onClose: () => void;
  /** Saves a new monthly budget; the drawer shows a message if it rejects. */
  onSaveBudget: (monthlyBudget: number) => Promise<unknown>;
  /** Asks to delete (the page confirms on top of the drawer). */
  onDelete: () => void;
};

/**
 * A goal's full details. "Edit budget" edits in place (the figures update
 * once saved); "Delete goal" asks the page to confirm.
 */
export function GoalDrawer({
  goal,
  icon,
  currency,
  onClose,
  onSaveBudget,
  onDelete,
}: GoalDrawerProps) {
  const { t } = useTranslation();
  const remaining = goal.monthlyBudget - goal.currentSpent;
  const [editing, setEditing] = useState(false);

  return (
    <Drawer
      title={t("goals.drawer.title")}
      closeLabel={t("goals.drawer.close")}
      onClose={onClose}
    >
      <div className="flex flex-col items-center text-center">
        <CategoryBadge category={goal.category} icon={icon} />
        <p className="mt-2 text-lg font-semibold text-heading">
          {goal.category}
        </p>
        <div className="mt-1">
          <GoalStatusBadge status={goal.status} />
        </div>
        <p className="mt-4 text-3xl font-bold text-heading">
          {formatCurrency(goal.currentSpent, currency)}
        </p>
        <p className="text-sm text-body">
          {t("goals.drawer.spentOf", {
            amount: formatCurrency(goal.monthlyBudget, currency),
          })}
        </p>
      </div>

      <div className="mt-5">
        <GoalProgress goal={goal} />
      </div>

      <DrawerDetails
        items={[
          {
            label: t("goals.drawer.budget"),
            value: formatCurrency(goal.monthlyBudget, currency),
          },
          {
            label: t("goals.drawer.spent"),
            value: formatCurrency(goal.currentSpent, currency),
          },
          remaining >= 0
            ? {
                label: t("goals.drawer.remaining"),
                value: formatCurrency(remaining, currency),
              }
            : {
                label: t("goals.drawer.overBy"),
                value: formatCurrency(-remaining, currency),
              },
          { label: t("goals.drawer.used"), value: goalPercent(goal) },
          {
            label: t("goals.drawer.daysLeft"),
            value: goal.daysRemaining,
          },
        ]}
      />

      {editing ? (
        <EditBudgetForm
          initial={goal.monthlyBudget}
          onCancel={() => setEditing(false)}
          onSave={async (amount) => {
            await onSaveBudget(amount);
            setEditing(false);
          }}
        />
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onDelete}
            className={`${secondaryButtonClass} flex-1 border border-slate-200`}
          >
            <LuTrash2 className="size-4" aria-hidden />
            {t("goals.drawer.delete")}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`${primaryButtonClass} flex-1`}
          >
            <LuPencil className="size-4" aria-hidden />
            {t("goals.drawer.edit")}
          </button>
        </div>
      )}
    </Drawer>
  );
}

function EditBudgetForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: number;
  onCancel: () => void;
  onSave: (amount: number) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [budget, setBudget] = useState(String(initial));
  const [error, setError] = useState<GoalFormErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const budgetError = error?.includes("budget") ? error : null;

  // Straight into the field, cursor after the current amount (not selected).
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const parsed = parseBudget(budget);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSave(parsed.amount);
    } catch {
      setError("goals.form.errors.generic");
      setPending(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
      <BudgetField
        inputRef={inputRef}
        value={budget}
        onChange={(value) => {
          setBudget(value);
          setError(null);
        }}
        error={budgetError}
      />
      {error && !budgetError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {t(error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={secondaryButtonClass}
        >
          {t("goals.form.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={primaryButtonClass}
        >
          {pending ? t("goals.form.saving") : t("goals.form.save")}
        </button>
      </div>
    </form>
  );
}
