/**
 * Profile query plus first-use seeding. Seeding is the server's
 * seed_plan_v1() RPC: idempotent and safe under simultaneous first logins on
 * two devices (WEBAPP_SPEC.md section 7.1). Returning users with
 * template_version 1 are never reseeded.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useProfile() {
  const api = useApi();
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.fetchProfile(),
  });
}

/**
 * Mutation wrapper for the one-time seed. The caller (AuthenticatedApp)
 * invokes mutate() when an authenticated user has no profile row; failures
 * are retryable and the RPC is idempotent.
 */
export function useSeedPlan() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.seedPlan(),
    onSuccess: () => queryClient.invalidateQueries(),
    retry: false,
  });
}
