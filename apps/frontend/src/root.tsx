import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { RootAppProvider } from "./providers/RootAppProvider";

export const Layout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="en" className="min-h-dvh">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fullstack-Bun Frontend</title>
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-dvh">
        <RootAppProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </RootAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default function Root() {
  return <Outlet />;
}
