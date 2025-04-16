import { type RouteConfig, index, route } from "@react-router/dev/routes";

const config: RouteConfig = [
  index("./pages/landing.tsx"),
  route("/more", "./pages/more.tsx"),
  route("*?", "catchall.tsx"),
];

export default config;
