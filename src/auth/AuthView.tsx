/**
 * Authentication view (WEBAPP_SPEC.md section 6.1): email magic-link sign-in
 * with shouldCreateUser disabled and a generic response that does not
 * disclose whether an address is allowed. Sign-out lives in Settings, but a
 * control is provided here for accessibility after authentication.
 */

import { useState, type FormEvent } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";
import { redirectUrl } from "./authCallback";
import { signOut } from "./useSession";

type FormStatus =
  { kind: "idle" } | { kind: "submitting" } | { kind: "sent" } | { kind: "error"; message: string };

export function AuthView() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          // Public signup is disabled; the sole user is pre-invited. The
          // response below is identical whether or not the address exists.
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl(window.location.origin, import.meta.env.BASE_URL),
        },
      });
      if (error) {
        // Unknown/allowed addresses are indistinguishable to the user.
        setStatus({ kind: "sent" });
        return;
      }
      setStatus({ kind: "sent" });
    } catch {
      setStatus({ kind: "error", message: "Sign-in is unavailable right now. Try again." });
    }
  }

  return (
    <section aria-labelledby="auth-title" className="auth-view">
      <h1 id="auth-title">Cohere Preparation Tracker</h1>
      <p className="auth-privacy">
        Private, single-user preparation tracker. Your progress is stored privately and never
        published. Sign in with the pre-registered email address; a sign-in link will be sent to it.
      </p>

      {status.kind === "sent" ? (
        <p role="status" className="auth-status">
          If the address is registered, a sign-in link is on its way. Follow it on this device to
          continue.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="auth-form">
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status.kind === "submitting"}
          />
          <button type="submit" disabled={status.kind === "submitting"}>
            {status.kind === "submitting" ? "Sending…" : "Send sign-in link"}
          </button>
          {status.kind === "error" && (
            <p role="alert" className="auth-error">
              {status.message}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

/** Rendered inside the shell after authentication (spec 6.1 sign-out control). */
export function SignOutControl() {
  return (
    <button type="button" onClick={() => void signOut()}>
      Sign out
    </button>
  );
}
