/**
 * Session hook: exposes the current Supabase session and auth-state
 * transitions to the React tree (WEBAPP_SPEC.md sections 6.1, 13).
 */

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";

export type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated" };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(
        data.session
          ? { status: "authenticated", session: data.session }
          : { status: "unauthenticated" },
      );
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: "authenticated", session } : { status: "unauthenticated" });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Sign out and clear session-scoped client state. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  // Task 8 will also clear the TanStack Query cache here so no personal data
  // from the previous session remains in memory (WEBAPP_SPEC.md section 14).
}
