import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import {
  useCreateGoal,
  useDeleteGoal,
  useUpdateGoal,
} from "../../api/mutations";
import { useFilters, useGoals, useProfile } from "../../api/queries";
import type { Goal } from "../../api/schemas";
import { useSession } from "../../auth/AuthContext";
import { primaryButtonClass } from "../../components/dashboard/formStyles";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { QueryContent, Skeleton } from "../../components/dashboard/Panel";
import { DeleteGoalDialog } from "../../components/goals/DeleteGoalDialog";
import { GoalCard } from "../../components/goals/GoalCard";
import { GoalDrawer } from "../../components/goals/GoalDrawer";
import { GoalFormDialog } from "../../components/goals/GoalFormDialog";

/**
 * Monthly budgets per category: GET /goals, plus create (POST), and from a
 * goal's drawer, edit the budget (PATCH) and delete (DELETE). Progress and
 * status come from the API.
 */
export function GoalsPage() {
  const { t } = useTranslation();
  const { customerId } = useSession();
  const goals = useGoals(customerId);
  const filters = useFilters(customerId);
  const profile = useProfile(customerId);
  const createGoal = useCreateGoal(customerId);
  const updateGoal = useUpdateGoal(customerId);
  const deleteGoal = useDeleteGoal(customerId);
  const [creating, setCreating] = useState(false);
  // The goal open in the drawer. Delete confirms on top of the drawer, which
  // stays open until the goal is actually deleted.
  const [viewing, setViewing] = useState<Goal | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Latest figures for the open goal (e.g. after saving a new budget).
  const viewed =
    viewing &&
    (goals.data?.goals.find((goal) => goal.id === viewing.id) ?? viewing);

  const categories = filters.data?.categories ?? [];
  const iconFor = (category: string) =>
    categories.find((c) => c.name === category)?.icon ?? "";
  // One goal per category, so only offer categories without one.
  const available = categories.filter(
    (category) =>
      !goals.data?.goals.some((goal) => goal.category === category.name),
  );
  const currency = profile.data?.currency;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("goals.title")}
        subtitle={t("goals.subtitle")}
        aside={
          !goals.isError && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={primaryButtonClass}
            >
              <LuPlus className="size-4" aria-hidden />
              {t("goals.create")}
            </button>
          )
        }
      />

      <div className="flex flex-col">
        <QueryContent
          query={goals}
          loading={
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <Skeleton key={card} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          }
          isEmpty={(data) => data.goals.length === 0}
          emptyMessage={t("goals.empty")}
        >
          {(data) => (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.goals.map((goal) => (
                <li key={goal.id}>
                  <GoalCard
                    goal={goal}
                    icon={iconFor(goal.category)}
                    currency={currency}
                    onOpen={() => setViewing(goal)}
                  />
                </li>
              ))}
            </ul>
          )}
        </QueryContent>
      </div>

      {viewed && (
        <GoalDrawer
          goal={viewed}
          icon={iconFor(viewed.category)}
          currency={currency}
          onClose={() => setViewing(null)}
          onSaveBudget={(monthlyBudget) =>
            updateGoal.mutateAsync({ goalId: viewed.id, monthlyBudget })
          }
          onDelete={() => setConfirmingDelete(true)}
        />
      )}
      {viewed && confirmingDelete && (
        <DeleteGoalDialog
          goal={viewed}
          currency={currency}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteGoal.mutateAsync(viewed.id);
            setConfirmingDelete(false);
            setViewing(null);
          }}
        />
      )}
      {creating && (
        <GoalFormDialog
          categories={available}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createGoal.mutateAsync(values);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
