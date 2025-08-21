import { QueryClient } from '@tanstack/react-query';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const STALE_TIME_MINUTES = 5;
const GC_TIME_MINUTES = 10;
const MAX_RETRY_DELAY = 30000;
const RETRY_ATTEMPTS = 3;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: RETRY_ATTEMPTS,
      retryDelay: (attemptIndex) =>
        Math.min(MILLISECONDS_IN_SECOND * 2 ** attemptIndex, MAX_RETRY_DELAY),
      staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * STALE_TIME_MINUTES,
      gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * GC_TIME_MINUTES,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});
