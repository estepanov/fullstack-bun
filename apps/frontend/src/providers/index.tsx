import { ReactNode } from 'react';
import { QueryClientProvider } from './query-client';

export const Providers = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider>{children}</QueryClientProvider>;
}
