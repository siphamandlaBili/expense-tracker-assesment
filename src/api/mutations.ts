import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "./customers";
import { queryKeys } from "./queries";
import type { CreateGoalInput, Goals, UpdateGoalInput } from "./schemas";

export function useCreateGoal(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      customersApi.createGoal(customerId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(customerId) }),
  });
}

export function useUpdateGoal(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, ...input }: UpdateGoalInput & { goalId: string }) =>
      customersApi.updateGoal(customerId, goalId, input),
    onSuccess: (updated) => {
      // The server returns the recalculated goal, so patch it straight in.
      queryClient.setQueryData<Goals>(queryKeys.goals(customerId), (current) =>
        current
          ? {
              goals: current.goals.map((goal) =>
                goal.id === updated.id ? updated : goal,
              ),
            }
          : current,
      );
    },
  });
}

export function useDeleteGoal(customerId: string) {
  const queryClient = useQueryClient();
  const goalsKey = queryKeys.goals(customerId);

  return useMutation({
    mutationFn: (goalId: string) => customersApi.deleteGoal(customerId, goalId),
    // Optimistic: remove the goal immediately, roll back if the call fails.
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: goalsKey });
      const previous = queryClient.getQueryData<Goals>(goalsKey);
      queryClient.setQueryData<Goals>(goalsKey, (current) =>
        current
          ? { goals: current.goals.filter((goal) => goal.id !== goalId) }
          : current,
      );
      return { previous };
    },
    onError: (_error, _goalId, context) => {
      queryClient.setQueryData(goalsKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}
