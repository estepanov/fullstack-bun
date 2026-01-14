import { authClient } from "@admin/lib/auth-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ADMIN_BANS_GET_QUERY_KEY, ADMIN_USERS_GET_QUERY_KEY } from "./query-key";
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
        // banExpiresIn: undefined, // permanent ban
      });
      if (error) throw error;

      // Then, optionally delete all their messages
      if (shouldDeleteMessages) {
        await deleteMessages.mutateAsync({ userId: id });
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_GET_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [ADMIN_BANS_GET_QUERY_KEY] });
    },
  });
};
