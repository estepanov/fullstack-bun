import type { ReactNode } from "react";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { QueryClientProvider } from "frontend-common/providers";
import { ThemeProvider } from "frontend-common/providers/theme";
import { ChatProvider } from "./ChatProvider";

const RootAppProviderBase = ({ children }: { children: ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider>
        <ThemeProvider defaultTheme="dark" storageKey="pref-ui-theme">
          <ChatProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  Loading...
                </div>
              }
            >
              {children}
            </Suspense>
          </ChatProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export const RootAppProvider = RootAppProviderBase;
