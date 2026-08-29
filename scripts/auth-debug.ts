import { createClient } from "@supabase/supabase-js";
import { ensureUser, USER_A, resetAllUserData } from "../tests/integration/helpers/testUsers";
import { getLocalSupabaseEnv } from "../tests/integration/helpers/localSupabase";

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

async function main() {
  const env = getLocalSupabaseEnv();
  await resetAllUserData();
  await ensureUser(USER_A);
  const client = createClient(env.apiUrl, env.publishableKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      storage: new MemoryStorage(),
      experimental: { appendPkceFlowIdToRedirects: true },
    },
  } as never);
  const { error } = await client.auth.signInWithOtp({
    email: USER_A.email,
    options: { shouldCreateUser: false, emailRedirectTo: "http://localhost:5173/" },
  });
  console.log("otp error:", error?.message ?? "none");
  const res = await fetch(`${env.mailpitUrl}/api/v1/messages?limit=1`);
  const body = await res.json();
  const msg = await (await fetch(`${env.mailpitUrl}/api/v1/message/${body.messages[0].ID}`)).json();
  const verifyUrl = (msg.Text ?? "").match(
    /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/,
  )?.[0];
  console.log("redirect_to has flow id:", verifyUrl?.includes("sb_flow_id"));
  const verify = await fetch(verifyUrl!, { redirect: "manual" });
  const location = verify.headers.get("location")!;
  console.log("location:", location.slice(0, 110));
  const params = new URL(location, "http://x").searchParams;
  const code = params.get("code");
  const flowId = params.get("sb_flow_id");
  const exchange = await client.auth.exchangeCodeForSession(code!, {
    flowId: flowId ?? undefined,
  } as never);
  console.log(
    "exchange error:",
    exchange.error?.message ?? "none",
    "| session?",
    Boolean(exchange.data.session),
  );
  process.exit(0);
}
main();
