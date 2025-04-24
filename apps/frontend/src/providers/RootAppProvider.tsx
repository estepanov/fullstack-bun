import i18n from "@/i18n";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { QueryClientProvider } from "./query-client";
import { ThemeProvider } from "./theme";

const RootAppProviderBase = ({ children }: { children: ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider>
        <ThemeProvider defaultTheme="dark" storageKey="pref-ui-theme">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export const RootAppProvider = RootAppProviderBase;
