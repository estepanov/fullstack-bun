import { type RouteConfig, index, route } from "@react-router/dev/routes";

const config: RouteConfig = [
  index("./pages/dashboard.tsx"),
  route("/users", "./pages/users/list.tsx"),
  route("/users/banned", "./pages/users/banned.tsx"),
  route("/notifications", "./pages/notifications/send.tsx"),
  route("*?", "catchall.tsx"),
];

export default config;
