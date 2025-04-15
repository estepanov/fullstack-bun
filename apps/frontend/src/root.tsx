import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { RootAppProvider } from "./providers/RootAppProvider";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fullstack-Bun Frontend</title>
        <Meta />
        <Links />
      </head>
      <body>
        <RootAppProvider>{children}</RootAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
