import { authClient } from "@frontend/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteUserMessagesMutation } from "./useDeleteUserMessagesMutation";

export const useBanUserMutation = () => {
  const queryClient = useQueryClient();
  const deleteMessages = useDeleteUserMessagesMutation();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      deleteMessages: shouldDeleteMessages,
    }: {
      id: string;
      reason?: string;
      deleteMessages?: boolean;
    }) => {
      // First, ban the user via better-auth plugin
      const { data, error } = await authClient.admin.banUser({
        userId: id,
        banReason: reason,
      });
      if (error) throw error;

      // Then, optionally delete all their messages
      if (shouldDeleteMessages) {
        await deleteMessages.mutateAsync({ userId: id });
      }

      return data;
    },
    onSuccess: async () => {
      // Invalidate any relevant queries after banning a user
      await queryClient.invalidateQueries();
    },
  });
};
