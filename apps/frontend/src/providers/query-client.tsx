import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from '@tanstack/react-query'
import { ReactNode } from 'react';

const queryClient = new QueryClient()

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
}