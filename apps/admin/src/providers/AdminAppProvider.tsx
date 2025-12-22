import { QueryClientProvider, ThemeProvider } from "frontend-common/providers";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

export const AdminAppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider>
        <ThemeProvider defaultTheme="dark" storageKey="admin-ui-theme">
          <Suspense fallback="Loading...">{children}</Suspense>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};
