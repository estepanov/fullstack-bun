import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import type { UserRole } from "shared/auth/user-role";
import { ADMIN_USERS_GET_QUERY_KEY } from "./query-key";

const $patch = apiClient.admin.users[":id"].role.$patch;

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InferResponseType<typeof $patch>,
    Error,
    { id: string; role: UserRole }
  >({
    mutationFn: async ({ id, role }) => {
      const res = await $patch({
        param: { id },
        json: { role },
      });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_GET_QUERY_KEY] });
    },
  });
};
