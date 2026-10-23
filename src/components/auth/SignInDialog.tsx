import { useId, useRef, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { LuArrowRight, LuEye, LuEyeOff } from "react-icons/lu";
import { ApiError } from "../../api/client";
import { inputClass } from "../dashboard/formStyles";
import { Modal } from "../dashboard/Modal";
import {
  ACCOUNT_NUMBER_LENGTH,
  PIN_LENGTH,
  validateSignIn,
  type SignInErrors,
  type SignInValues,
} from "./signInSchema";

type SignInDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Signs in; the dialog shows a message if the promise rejects. */
  onSubmit: (values: SignInValues) => Promise<unknown>;
};

const EMPTY_VALUES: SignInValues = { accountNumber: "", pin: "" };

const digitsOnly = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

export function SignInDialog({ open, ...props }: SignInDialogProps) {
  // Unmounting the panel on close discards all form state, so every way of
  // closing (Escape, backdrop, close button, submit) starts fresh next time.
  return open ? <SignInDialogPanel {...props} /> : null;
}

function SignInDialogPanel({
  onClose,
  onSubmit,
}: Omit<SignInDialogProps, "open">) {
  const { t } = useTranslation();
  const accountId = useId();
  const pinId = useId();
  const accountInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<SignInValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<
    "signIn.errors.invalidCredentials" | "signIn.errors.generic" | null
  >(null);

  const updateField = (field: keyof SignInValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setSubmitError(null);
    if (submitted) setErrors(validateSignIn(next));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    setSubmitError(null);

    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      // On success the parent navigates away, which unmounts this dialog.
      await onSubmit(values);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status === 401
          ? "signIn.errors.invalidCredentials"
          : "signIn.errors.generic",
      );
      setPending(false);
    }
  };

  return (
    <Modal
      title={t("signIn.title")}
      description={t("signIn.subtitle")}
      closeLabel={t("signIn.close")}
      onClose={onClose}
      initialFocus={accountInputRef}
      backdropTestId="sign-in-backdrop"
    >
      <form
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit}
        className="mt-5 space-y-3"
      >
        <div>
          <label
            htmlFor={accountId}
            className="mb-1 block text-sm font-medium text-heading"
          >
            {t("signIn.accountNumber")}
          </label>
          <input
            ref={accountInputRef}
            id={accountId}
            name="accountNumber"
            inputMode="numeric"
            autoComplete="off"
            maxLength={ACCOUNT_NUMBER_LENGTH}
            placeholder={t("signIn.accountNumberPlaceholder")}
            value={values.accountNumber}
            onChange={(event) =>
              updateField(
                "accountNumber",
                digitsOnly(event.target.value, ACCOUNT_NUMBER_LENGTH),
              )
            }
            aria-invalid={Boolean(errors.accountNumber)}
            aria-describedby={`${accountId}-hint`}
            className={inputClass(Boolean(errors.accountNumber))}
          />
          <p
            id={`${accountId}-hint`}
            className={`mt-1 text-xs ${errors.accountNumber ? "text-red-600" : "text-body"}`}
          >
            {errors.accountNumber
              ? t(errors.accountNumber)
              : t("signIn.accountNumberHint", {
                  count: ACCOUNT_NUMBER_LENGTH,
                })}
          </p>
        </div>

        <div>
          <label
            htmlFor={pinId}
            className="mb-1 block text-sm font-medium text-heading"
          >
            {t("signIn.pin")}
          </label>
          <div className="relative">
            <input
              id={pinId}
              name="pin"
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              value={values.pin}
              onChange={(event) =>
                updateField("pin", digitsOnly(event.target.value, PIN_LENGTH))
              }
              aria-invalid={Boolean(errors.pin)}
              aria-describedby={`${pinId}-hint`}
              className={`${inputClass(Boolean(errors.pin))} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPin((show) => !show)}
              aria-label={showPin ? t("signIn.hidePin") : t("signIn.showPin")}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-body hover:text-primary"
            >
              {showPin ? (
                <LuEyeOff className="size-5" aria-hidden />
              ) : (
                <LuEye className="size-5" aria-hidden />
              )}
            </button>
          </div>
          <p
            id={`${pinId}-hint`}
            className={`mt-1 text-xs ${errors.pin ? "text-red-600" : "text-body"}`}
          >
            {errors.pin
              ? t(errors.pin)
              : t("signIn.pinHint", { count: PIN_LENGTH })}
          </p>
        </div>

        {submitError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            {t(submitError)}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="mt-1 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-7 py-3 font-medium text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? t("signIn.submitting") : t("signIn.submit")}
          <LuArrowRight className="size-5" aria-hidden />
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-body">
        {t("signIn.noAccount")}{" "}
        <a
          href="#open-account"
          onClick={onClose}
          className="font-semibold text-primary hover:underline"
        >
          {t("nav.openAccount")}
        </a>
      </p>
    </Modal>
  );
}
