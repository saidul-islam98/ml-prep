/**
 * Device/server clock-skew detection (WEBAPP_SPEC.md section 8.3): if device
 * time differs from server time by more than five minutes, the UI warns the
 * user because deadline comparisons are server-side.
 */

export const CLOCK_SKEW_THRESHOLD_MS = 5 * 60 * 1000;

export interface ClockCheck {
  deltaMs: number;
  exceedsThreshold: boolean;
}

/**
 * Compare the server's Date header with the local clock. `fetchFn` is
 * injectable for tests. Returns serverTime - clientTime in milliseconds.
 */
export async function fetchClockCheck(
  supabaseUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<ClockCheck | null> {
  try {
    const res = await fetchFn(`${supabaseUrl}/auth/v1/health`, { method: "GET" });
    const dateHeader = res.headers.get("date");
    if (!dateHeader) return null;
    const serverMs = Date.parse(dateHeader);
    if (Number.isNaN(serverMs)) return null;
    const deltaMs = serverMs - Date.now();
    return { deltaMs, exceedsThreshold: Math.abs(deltaMs) > CLOCK_SKEW_THRESHOLD_MS };
  } catch {
    return null;
  }
}

/** Formatted, user-safe skew description (minute granularity). */
export function formatSkew(deltaMs: number): string {
  const minutes = Math.round(Math.abs(deltaMs) / 60_000);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
