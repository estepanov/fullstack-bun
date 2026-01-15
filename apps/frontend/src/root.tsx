import { Footer } from "@frontend/components/Footer";
import { Header } from "@frontend/components/Header";
import { Toaster } from "frontend-common/components/ui/sonner";
import { Links, Outlet, Scripts, ScrollRestoration } from "react-router";
import { APP_NAME } from "./app.config";
import { RootAppProvider } from "./providers/RootAppProvider";

export default function Root() {
  return (
    <html lang="en" className="min-h-dvh">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{APP_NAME}</title>
        <Links />
      </head>
      <body className="flex flex-col min-h-dvh">
        <RootAppProvider>
          <Header />
          <Outlet />
          <Footer />
          <Toaster richColors />
        </RootAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
