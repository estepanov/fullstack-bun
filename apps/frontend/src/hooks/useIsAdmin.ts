import { useSession } from "@/lib/auth-client";
import { isAdminSession } from "@/lib/user-role";

export const useIsAdmin = () => {
  const { data: session, isPending } = useSession();
  const isAdmin = isAdminSession(session);

  return { isAdmin, isPending, session };
};
