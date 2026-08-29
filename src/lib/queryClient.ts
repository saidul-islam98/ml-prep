/**
 * Application-wide query client. Server data is authoritative; stale data is
 * refetched on focus and reconnect. Sign-out clears the entire cache so no
 * personal data from a previous session survives in memory
 * (WEBAPP_SPEC.md section 14).
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 15_000,
    },
  },
});
