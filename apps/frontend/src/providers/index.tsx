import { ReactNode } from 'react';
import { QueryClientProvider } from './query-client';
import { ThemeProvider } from './theme';

export const Providers = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider>
        <ThemeProvider defaultTheme="dark" storageKey="pref-ui-theme">
            {children}
        </ThemeProvider>
    </QueryClientProvider>;
}
