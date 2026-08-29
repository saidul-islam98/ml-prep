/**
 * PKCE auth E2E against the isolated local Supabase stack (todo.md Task 5).
 *
 * Flow: signInWithOtp (shouldCreateUser: false) -> magic-link email captured
 * from Mailpit -> verify URL followed with redirect:manual -> the provider
 * redirects to the client root with ?code= -> exchangeCodeForSession on the
 * same client (holding the PKCE verifier) yields a session.
 *
 * Also proves: unknown emails gain no account/session, public signup is
 * disabled, and the callback is consumable before hash routing with the URL
 * stripped afterwards.
 */

import { describe, expect, it, beforeAll, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  authenticatedClient,
  ensureBothUsers,
  ensureUser,
  USER_A,
  withDb,
} from "./helpers/testUsers";
import { getLocalSupabaseEnv } from "./helpers/localSupabase";
import { consumeAuthCallback } from "../../src/auth/bootstrap";

const env = getLocalSupabaseEnv();
const REDIRECT_TO = "http://localhost:5173/";

interface MailpitMessage {
  ID: string;
  To: { Address: string }[];
  Subject: string;
}

async function latestMessageFor(email: string): Promise<MailpitMessage | null> {
  const res = await fetch(`${env.mailpitUrl}/api/v1/messages?limit=20`);
  const body = (await res.json()) as { messages: MailpitMessage[] };
  return body.messages.find((m) => m.To.some((t) => t.Address === email)) ?? null;
}

async function messageText(id: string): Promise<string> {
  const res = await fetch(`${env.mailpitUrl}/api/v1/message/${id}`);
  const body = (await res.json()) as { Text: string; HTML: string };
  return body.Text || body.HTML;
}

/**
 * supabase-js skips PKCE verifier storage in non-browser runtimes
 * (isBrowser() guard). Injecting a spec-shaped memory storage mirrors the
 * browser contract so the PKCE exchange can be proven end to end here.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

function pkceClient() {
  return createClient(env.apiUrl, env.publishableKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      storage: new MemoryStorage(),
    },
  });
}

beforeAll(async () => {
  await ensureBothUsers();
});

describe("magic-link PKCE sign-in (local stack)", () => {
  it("sends a magic link to the pre-created user and completes the PKCE exchange", async () => {
    const client = pkceClient();

    const { error } = await client.auth.signInWithOtp({
      email: USER_A.email,
      options: { shouldCreateUser: false, emailRedirectTo: REDIRECT_TO },
    });
    expect(error).toBeNull();

    const message = await latestMessageFor(USER_A.email);
    expect(message, "magic-link email should arrive in Mailpit").toBeTruthy();
    const text = await messageText(message!.ID);
    const verifyUrl = text.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/)?.[0];
    expect(verifyUrl, "email contains a verify URL").toBeTruthy();

    // Following the verify URL redirects to the client root with a code.
    const verify = await fetch(verifyUrl!, { redirect: "manual" });
    expect(verify.status).toBeGreaterThanOrEqual(300);
    expect(verify.status).toBeLessThan(400);
    const location = verify.headers.get("location");
    expect(location, "redirects to the client root").toBeTruthy();
    expect(location!.startsWith(REDIRECT_TO)).toBe(true);
    const code = new URL(location!, REDIRECT_TO).searchParams.get("code");
    expect(code).toBeTruthy();

    // The same client (holding the PKCE verifier) exchanges the code.
    const exchange = await client.auth.exchangeCodeForSession(code!);
    expect(exchange.error).toBeNull();
    expect(exchange.data.session).toBeTruthy();
    expect(exchange.data.user?.email).toBe(USER_A.email);
    expect(exchange.data.user?.id).toBeTruthy();
  }, 30_000);

  it("gives an unknown email no account and no session", async () => {
    const unknown = "stranger@not-registered.example";
    const client = createClient(env.apiUrl, env.publishableKey, {
      auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: false },
    });
    const { data, error } = await client.auth.signInWithOtp({
      email: unknown,
      options: { shouldCreateUser: false, emailRedirectTo: REDIRECT_TO },
    });
    // The API may return success or an error; either way the UI shows the
    // same generic message. What must never happen: account creation or a
    // session.
    expect(data.session).toBeNull();
    expect(data.user).toBeNull();

    // No email is sent for an unknown address (nothing to receive).
    await new Promise((r) => setTimeout(r, 300));
    const message = await latestMessageFor(unknown);
    expect(message).toBeNull();

    const users = await withDb(async (db) => {
      const res = await db.query<{ count: string }>(
        "select count(*)::text as count from auth.users where email = $1",
        [unknown],
      );
      return Number(res.rows[0].count);
    });
    expect(users).toBe(0);
    void error;
  }, 30_000);

  it("public signup is disabled on the local stack", async () => {
    // Clean any probe rows from earlier runs before asserting.
    await withDb(async (db) => {
      await db.query("delete from auth.users where email = 'signup-attempt@example.com'");
    });
    const client = createClient(env.apiUrl, env.publishableKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.auth.signUp({
      email: "signup-attempt@example.com",
      password: "not-allowed-passw0rd",
    });
    // Either an error or a user without a session (signups disabled); the
    // account must never be usable.
    if (data.user) {
      expect(data.session).toBeNull();
    } else {
      expect(error).not.toBeNull();
    }
    const count = await withDb(async (db) => {
      const res = await db.query<{ count: string }>(
        "select count(*)::text as count from auth.users where email = 'signup-attempt@example.com'",
      );
      return Number(res.rows[0].count);
    });
    expect(count).toBe(0);
  });

  it("an authenticated session reaches protected data through RLS", async () => {
    const user = await ensureUser(USER_A);
    const client = await authenticatedClient(user);
    const { error } = await client.rpc("seed_plan_v1");
    expect(error).toBeNull();
    const tasks = await client.from("tasks").select("template_task_key");
    expect(tasks.error).toBeNull();
    expect(tasks.data?.length).toBe(118);
  });
});

describe("callback consumed before hash routing", () => {
  it("exchanges the code and strips the query while keeping the hash route", async () => {
    const exchangeCodes: string[] = [];
    const fakeExchanger = {
      exchangeCodeForSession: async (code: string) => {
        exchangeCodes.push(code);
        return { error: null };
      },
    };
    const replaceState = vi.fn();
    const result = await consumeAuthCallback(
      { search: "?code=xyz", pathname: "/ml-prep/", hash: "#/today" },
      { replaceState },
      fakeExchanger,
    );
    expect(result.callbackError).toBeUndefined();
    expect(exchangeCodes).toEqual(["xyz"]);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/ml-prep/#/today");
  });

  it("strips the URL and reports a friendly error when the exchange fails", async () => {
    const fakeExchanger = {
      exchangeCodeForSession: async () => ({ error: { message: "bad verifier" } }),
    };
    const replaceState = vi.fn();
    const result = await consumeAuthCallback(
      { search: "?code=stale", pathname: "/ml-prep/", hash: "" },
      { replaceState },
      fakeExchanger,
    );
    expect(result.callbackError).toMatch(/invalid or has expired/);
    expect(replaceState).toHaveBeenCalledWith(null, "", "/ml-prep/");
  });

  it("does nothing when no callback is present", async () => {
    const replaceState = vi.fn();
    const result = await consumeAuthCallback(
      { search: "", pathname: "/ml-prep/", hash: "#/plan" },
      { replaceState },
      { exchangeCodeForSession: async () => ({ error: null }) },
    );
    expect(result.callbackError).toBeUndefined();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
