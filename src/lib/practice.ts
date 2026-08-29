/**
 * Practice-session helpers (WEBAPP_SPEC.md sections 6.5 and 17).
 */

export interface PracticeSessionLike {
  id: string;
  session_type: string;
  state: string;
  result: string | null;
  completed_at: string | null;
}

/**
 * The latest-ten predicate: completed coding sessions with a recorded result,
 * newest completion first, capped at ten. Drives the coding readiness gate
 * ("solve 8 of the latest 10").
 */
export function latestTenQualifyingCodingSessions<T extends PracticeSessionLike>(
  sessions: T[],
): T[] {
  return sessions
    .filter(
      (s) =>
        s.session_type === "coding" &&
        s.state === "completed" &&
        s.result !== null &&
        s.result.trim() !== "" &&
        s.completed_at !== null,
    )
    .sort((a, b) => Date.parse(b.completed_at as string) - Date.parse(a.completed_at as string))
    .slice(0, 10);
}

/** Coding-gate signal: qualifying sessions solved within the limit. */
export function codingGateSummary(latest: PracticeSessionLike[]): {
  solved: number;
  total: number;
  meetsGate: boolean;
} {
  const solved = latest.filter((s) => (s.result ?? "").trim().toLowerCase() === "solved").length;
  return { solved, total: latest.length, meetsGate: latest.length > 0 && solved >= 8 };
}

export const MOCK_DIMENSIONS = [
  "problem_framing",
  "technical_depth",
  "evidence",
  "tradeoffs",
  "engineering_quality",
  "product_judgment",
  "communication",
  "integrity",
] as const;

export type MockDimension = (typeof MOCK_DIMENSIONS)[number];

export const MOCK_DIMENSION_LABELS: Record<MockDimension, string> = {
  problem_framing: "Problem framing",
  technical_depth: "Technical depth",
  evidence: "Evidence",
  tradeoffs: "Tradeoffs",
  engineering_quality: "Engineering quality",
  product_judgment: "Product judgment",
  communication: "Communication",
  integrity: "Integrity",
};
