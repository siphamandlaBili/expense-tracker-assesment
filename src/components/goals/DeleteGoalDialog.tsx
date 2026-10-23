import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Goal } from "../../api/schemas";
import { formatCurrency } from "../../lib/format";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "../dashboard/formStyles";
import { Modal } from "../dashboard/Modal";

type DeleteGoalDialogProps = {
  goal: Goal;
  currency?: string;
  onClose: () => void;
  /** Deletes; the dialog shows a message if the promise rejects. */
  onConfirm: () => Promise<unknown>;
};

/** Confirms deleting a goal. Focus starts on Cancel, the safe choice. */
export function DeleteGoalDialog({
  goal,
  currency,
  onClose,
  onConfirm,
}: DeleteGoalDialogProps) {
  const { t } = useTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirm = async () => {
    setPending(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch {
      setFailed(true);
      setPending(false);
    }
  };

  return (
    <Modal
      title={t("goals.delete.title", { category: goal.category })}
      description={t("goals.delete.description", {
        amount: formatCurrency(goal.monthlyBudget, currency),
      })}
      onClose={onClose}
      initialFocus={cancelRef}
    >
      {failed && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {t("goals.delete.error")}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onClose}
          className={secondaryButtonClass}
        >
          {t("goals.delete.cancel")}
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
          className={primaryButtonClass}
        >
          {pending ? t("goals.delete.deleting") : t("goals.delete.confirm")}
        </button>
      </div>
    </Modal>
  );
}
