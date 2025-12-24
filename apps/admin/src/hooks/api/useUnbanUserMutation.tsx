import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { ADMIN_USERS_GET_QUERY_KEY, ADMIN_BANS_GET_QUERY_KEY } from "./query-key";

export const useUnbanUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await authClient.admin.unbanUser({
        userId: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_GET_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [ADMIN_BANS_GET_QUERY_KEY] });
    },
  });
};
