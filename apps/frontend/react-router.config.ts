import type * as config from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: false,
  async prerender() {
    return ["/"];
  },
} satisfies config.Config;
