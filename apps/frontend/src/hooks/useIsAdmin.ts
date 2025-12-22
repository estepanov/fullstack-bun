import { useSession } from "@/lib/auth-client";
import { createUseIsAdmin } from "frontend-common/hooks";

// Create the useIsAdmin hook with the app's useSession
export const useIsAdmin = createUseIsAdmin(useSession);
