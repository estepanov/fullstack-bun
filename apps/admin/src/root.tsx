import { Toaster } from "frontend-common/components/ui/sonner";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { AdminAuthGuard } from "./components/AdminAuthGuard";
import { AdminLayout } from "./components/AdminLayout";
import { AdminAppProvider } from "./providers/AdminAppProvider";
import "./index.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster richColors />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <AdminAppProvider>
      <AdminAuthGuard>
        <AdminLayout />
      </AdminAuthGuard>
    </AdminAppProvider>
  );
}
