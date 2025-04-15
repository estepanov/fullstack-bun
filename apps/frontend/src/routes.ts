import { type RouteConfig, route } from "@react-router/dev/routes";

const config: RouteConfig = [
  route("/", "./pages/landing.tsx"),
  route("*?", "catchall.tsx"),
];

export default config;
