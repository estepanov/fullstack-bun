import { type RouteConfig, index, route } from "@react-router/dev/routes";

const config: RouteConfig = [
  index("./pages/landing.tsx"),
  route("/more", "./pages/more.tsx"),
  route("/auth/login", "./pages/auth/login.tsx"),
  route("/auth/magic-link", "./pages/auth/magic-link.tsx"),
  route("/auth/magic-link/verify", "./pages/auth/magic-link-verify.tsx"),
  route("/auth/register", "./pages/auth/register.tsx"),
  route("/auth/verify-email", "./pages/auth/verify-email.tsx"),
  route("/auth/verify-email-notice", "./pages/auth/verify-email-notice.tsx"),
  route("/profile/complete", "./pages/profile/complete.tsx"),
  route("/dashboard", "./pages/dashboard.tsx"),
  route("*?", "catchall.tsx"),
];

export default config;
