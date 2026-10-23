import { useRef, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import type { CategoryMeta } from "../../api/schemas";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "../dashboard/formStyles";
import { Modal } from "../dashboard/Modal";
import { Select } from "../dashboard/Select";
import { BudgetField } from "./BudgetField";
import { parseBudget, type GoalFormErrorKey } from "./goalSchema";

export type GoalFormValues = { category: string; monthlyBudget: number };

type GoalFormDialogProps = {
  /** Categories that don't have a goal yet. */
  categories: CategoryMeta[];
  onClose: () => void;
  /** Saves; the dialog shows a message if the promise rejects. */
  onSubmit: (values: GoalFormValues) => Promise<unknown>;
};

/** Create a goal: a category without one, and a monthly budget. */
export function GoalFormDialog({
  categories,
  onClose,
  onSubmit,
}: GoalFormDialogProps) {
  const { t } = useTranslation();
  const budgetRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(categories[0]?.name ?? "");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<GoalFormErrorKey | null>(null);
  const [pending, setPending] = useState(false);
  const budgetError = error?.includes("budget") ? error : null;

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
      await onSubmit({ category, monthlyBudget: parsed.amount });
    } catch (submitError) {
      setError(
        submitError instanceof ApiError && submitError.status === 409
          ? "goals.form.errors.duplicate"
          : "goals.form.errors.generic",
      );
      setPending(false);
    }
  };

  return (
    <Modal
      title={t("goals.form.createTitle")}
      description={t("goals.form.createDescription")}
      closeLabel={t("goals.form.close")}
      onClose={onClose}
      initialFocus={budgetRef}
    >
      {categories.length === 0 ? (
        <>
          <p className="mt-5 text-sm text-body">
            {t("goals.form.noCategories")}
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={secondaryButtonClass}
            >
              {t("goals.form.close")}
            </button>
          </div>
        </>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Select
            label={t("goals.form.category")}
            value={category}
            options={categories.map(({ name }) => ({
              value: name,
              label: name,
            }))}
            onChange={setCategory}
          />

          <BudgetField
            inputRef={budgetRef}
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

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
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
              {pending ? t("goals.form.saving") : t("goals.form.create")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
