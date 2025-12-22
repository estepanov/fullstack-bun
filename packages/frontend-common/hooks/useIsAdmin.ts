// Note: This hook requires auth client to be initialized in the consuming app
// Import useSession from your app's auth client setup
import { isAdminSession } from "../auth/user-role";

// This is a helper that expects useSession to be passed in
// Each app will need to wrap this with their own useSession hook
export const createUseIsAdmin = (useSession: () => { data: unknown; isPending: boolean }) => {
  return () => {
    const { data: session, isPending } = useSession();
    const isAdmin = isAdminSession(session);

    return { isAdmin, isPending, session };
  };
};

// Export isAdminSession for direct use
export { isAdminSession };
