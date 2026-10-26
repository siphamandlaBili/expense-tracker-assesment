import { z } from "zod";
import { currencySymbol } from "../../lib/format";
import type en from "../../i18n/locales/en.json";

export type GoalFormErrorKey =
  `goals.form.errors.${keyof (typeof en)["goals"]["form"]["errors"]}`;

const errorKey = (key: GoalFormErrorKey) => ({ error: key });

/** Highest monthly budget the form accepts. */
export const MAX_BUDGET = 1_000_000;

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The budget field is free text ("R 1,500.50" is fine): strip the currency's
// symbol or code, spaces and thousands separators, then expect units and cents.
export function budgetSchema(currency = "ZAR") {
  const marker = new RegExp(
    [currencySymbol(currency), currency].map(escapeRegExp).join("|"),
    "gi",
  );
  return z
    .string()
    .transform((value) => value.replace(marker, "").replace(/[\s,]/g, ""))
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
}

/**
 * The budget as a number, or the translation key of what's wrong with it.
 * `currency` is the profile currency, whose symbol the customer may type.
 */
export function parseBudget(
  value: string,
  currency?: string,
):
  | { amount: number; error?: undefined }
  | { amount?: undefined; error: GoalFormErrorKey } {
  const result = budgetSchema(currency).safeParse(value);
  return result.success
    ? { amount: result.data }
    : { error: result.error.issues[0].message as GoalFormErrorKey };
}
