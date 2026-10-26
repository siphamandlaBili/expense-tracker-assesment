import { useId, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { currencySymbol } from "../../lib/format";
import { inputClass } from "../dashboard/formStyles";
import type { GoalFormErrorKey } from "./goalSchema";

type BudgetFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** A budget problem to show under the field (replaces the hint). */
  error?: GoalFormErrorKey | null;
  inputRef?: Ref<HTMLInputElement>;
  /** The profile currency; its symbol prefixes the input. */
  currency?: string;
};

/**
 * "Monthly budget" input with the currency symbol as a prefix (create
 * dialog, drawer edit).
 */
export function BudgetField({
  value,
  onChange,
  error,
  inputRef,
  currency,
}: BudgetFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = `${id}-hint`;
  const symbol = currencySymbol(currency);

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
          {symbol}
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
          // Clear of the prefix, however wide the symbol (R, $, CHF).
          style={{ paddingLeft: `calc(1.75rem + ${symbol.length}ch)` }}
          className={inputClass(Boolean(error))}
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
