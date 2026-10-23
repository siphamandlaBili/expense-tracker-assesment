import { useId, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { inputClass } from "../dashboard/formStyles";
import type { GoalFormErrorKey } from "./goalSchema";

type BudgetFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** A budget problem to show under the field (replaces the hint). */
  error?: GoalFormErrorKey | null;
  inputRef?: Ref<HTMLInputElement>;
};

/** "Monthly budget" input with an R prefix (create dialog, drawer edit). */
export function BudgetField({
  value,
  onChange,
  error,
  inputRef,
}: BudgetFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-heading"
      >
        {t("goals.form.budget")}
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-body"
        >
          R
        </span>
        <input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={hintId}
          className={`${inputClass(Boolean(error))} pl-9`}
        />
      </div>
      <p
        id={hintId}
        className={`mt-1 text-xs ${error ? "text-red-600" : "text-body"}`}
      >
        {error ? t(error) : t("goals.form.budgetHint")}
      </p>
    </div>
  );
}
