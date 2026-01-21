import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { isDemoMode } from "./lib/demo";
import "./index.css";
// Import i18n to initialize it (side effect), Suspense handles loading states
import "./i18n";

const enableMocking = async () => {
  if (!isDemoMode) {
    return;
  }

  const { worker } = await import("./mocks/browser");

  await worker.start({
    onUnhandledRequest(request, print) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (apiBaseUrl && request.url.startsWith(apiBaseUrl)) {
        print.error();
        throw new Error(
          `Unhandled demo API request blocked by MSW: ${request.method} ${request.url}`,
        );
      }
    },
  });
};

enableMocking().then(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
