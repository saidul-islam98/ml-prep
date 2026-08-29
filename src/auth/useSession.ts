/**
 * Session hook: exposes the current Supabase session and auth-state
 * transitions to the React tree (WEBAPP_SPEC.md sections 6.1, 13, 14).
 */

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabaseClient";
import { queryClient } from "../lib/queryClient";

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

/**
 * Sign out and clear every piece of session-scoped client state: the query
 * cache and session storage tokens. Non-sensitive UI preferences only.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  queryClient.clear();
}
