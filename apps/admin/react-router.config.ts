import type { Config } from "@react-router/dev/config";

const isDemoMode = process.env.VITE_ADMIN_DEMO === "true";

export default {
  appDirectory: "src",
  ssr: isDemoMode,
  serverModuleFormat: "esm",
} satisfies Config;
