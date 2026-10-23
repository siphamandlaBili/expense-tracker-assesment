import { z } from "zod";
import type en from "../../i18n/locales/en.json";

export type GoalFormErrorKey =
  `goals.form.errors.${keyof (typeof en)["goals"]["form"]["errors"]}`;

const errorKey = (key: GoalFormErrorKey) => ({ error: key });

/** Highest monthly budget the form accepts. */
export const MAX_BUDGET = 1_000_000;

// The budget field is free text ("R 1,500.50" is fine): strip the currency
// symbol, spaces and thousands separators, then expect rand and cents.
export const budgetSchema = z
  .string()
  .transform((value) => value.replace(/[R\s,]/gi, ""))
  .pipe(
    z
      .string()
      .min(1, errorKey("goals.form.errors.budgetRequired"))
      .regex(/^\d+(\.\d{1,2})?$/, errorKey("goals.form.errors.budgetInvalid"))
      .transform(Number)
      .refine(
        (amount) => amount > 0,
        errorKey("goals.form.errors.budgetPositive"),
      )
      .refine(
        (amount) => amount <= MAX_BUDGET,
        errorKey("goals.form.errors.budgetTooHigh"),
      ),
  );

/** The budget in rand, or the translation key of what's wrong with it. */
export function parseBudget(
  value: string,
):
  | { amount: number; error?: undefined }
  | { amount?: undefined; error: GoalFormErrorKey } {
  const result = budgetSchema.safeParse(value);
  return result.success
    ? { amount: result.data }
    : { error: result.error.issues[0].message as GoalFormErrorKey };
}
