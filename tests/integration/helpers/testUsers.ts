/**
 * Deterministic two-user provisioning and reset helpers for integration
 * tests (todo.md Task 3a). Uses the local stack's service-role key via the
 * Admin API - acceptable ONLY against the isolated local Supabase instance;
 * production must never see these credentials or flows.
 */

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { getLocalSupabaseEnv } from "./localSupabase";

export const USER_A = {
  email: "test-user-a@ml-prep.local",
  password: "integration-a-passw0rd",
} as const;

export const USER_B = {
  email: "test-user-b@ml-prep.local",
  password: "integration-b-passw0rd",
} as const;

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/** Admin-API client (service role, local stack only). */
export function adminClient() {
  const env = getLocalSupabaseEnv();
  return createClient(env.apiUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Anonymous client for unauthenticated request behavior tests. */
export function anonClient() {
  const env = getLocalSupabaseEnv();
  return createClient(env.apiUrl, env.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Client authenticated as a test user via password sign-in. */
export async function authenticatedClient(user: TestUser) {
  const env = getLocalSupabaseEnv();
  const client = createClient(env.apiUrl, env.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Sign-in failed for ${user.email}: ${error.message}`);
  return client;
}

/**
 * Provision a deterministic, confirmed test user. Idempotent: returns the
 * existing user when the email is already registered.
 */
export async function ensureUser(spec: { email: string; password: string }): Promise<TestUser> {
  const admin = adminClient();
  const existing = await admin.auth.admin.listUsers();
  const found = existing.data.users.find((u) => u.email === spec.email);
  if (found) {
    return { id: found.id, email: spec.email, password: spec.password };
  }
  const created = await admin.auth.admin.createUser({
    email: spec.email,
    password: spec.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`Failed to create ${spec.email}: ${created.error?.message ?? "no user"}`);
  }
  return { id: created.data.user.id, email: spec.email, password: spec.password };
}

/** Provision both deterministic users. */
export async function ensureBothUsers(): Promise<{ userA: TestUser; userB: TestUser }> {
  return { userA: await ensureUser(USER_A), userB: await ensureUser(USER_B) };
}

/** Direct SQL client for resets and privilege assertions (local only). */
export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const env = getLocalSupabaseEnv();
  const client = new Client({ connectionString: env.dbUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Remove all application-owned rows and both test users so each test starts
 * from a clean, no-profile state. Order respects FK cascades (deleting auth
 * users cascades app rows once the schema defines it).
 */
export async function resetAllUserData(): Promise<void> {
  await withDb(async (db) => {
    // App tables (schema lands in Task 3b; tolerate absence).
    const appTables = [
      "task_events",
      "tasks",
      "project_milestones",
      "projects",
      "mock_scores",
      "practice_sessions",
      "readiness_gates",
      "daily_checkins",
      "plan_weeks",
      "profiles",
    ];
    for (const table of appTables) {
      await db.query(`DELETE FROM public.${table}`).catch(() => {
        /* table not created yet */
      });
    }
    await db.query(`DELETE FROM auth.users WHERE email IN ($1, $2)`, [USER_A.email, USER_B.email]);
  });
}
