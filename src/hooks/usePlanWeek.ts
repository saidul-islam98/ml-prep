/**
 * The plan week containing today's Toronto date - used by the shell sidebar
 * and the Today header.
 */

import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { torontoToday } from "../lib/toronto";
import { useMemo } from "react";

export function useCurrentPlanWeek() {
  const api = useApi();
  const today = torontoToday();
  const { data: weeks } = useQuery({
    queryKey: ["plan-weeks"],
    queryFn: () => api.fetchPlanWeeks(),
  });
  return useMemo(
    () => weeks?.find((w) => today >= w.start_date && today <= w.end_date) ?? null,
    [weeks, today],
  );
}
