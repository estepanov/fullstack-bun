import type * as config from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  serverModuleFormat: "esm",
  future: {
    unstable_singleFetch: true,
  },
} satisfies config.Config;
