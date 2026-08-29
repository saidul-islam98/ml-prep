/**
 * Harness smoke test (todo.md Task 3a): the isolated local Supabase stack is
 * reachable, deterministic test users can be provisioned and reset, and two
 * users receive distinct identities.
 */

import { describe, expect, it } from "vitest";
import {
  anonClient,
  authenticatedClient,
  ensureBothUsers,
  resetAllUserData,
  withDb,
} from "./helpers/testUsers";

describe("local Supabase harness", () => {
  it("exposes API, DB, and mail endpoints from supabase status", async () => {
    const { getLocalSupabaseEnv } = await import("./helpers/localSupabase");
    const env = getLocalSupabaseEnv();
    expect(env.apiUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(env.dbUrl).toMatch(/^postgresql:\/\//);
    expect(env.publishableKey).toBeTruthy();
    expect(env.serviceRoleKey).toBeTruthy();
  });

  it("provisions two deterministic test users with stable ids", async () => {
    const first = await ensureBothUsers();
    const second = await ensureBothUsers();
    expect(second.userA.id).toBe(first.userA.id);
    expect(second.userB.id).toBe(first.userB.id);
    expect(first.userA.id).not.toBe(first.userB.id);
  });

  it("allows both users to sign in with their passwords", async () => {
    const { userA, userB } = await ensureBothUsers();
    const clientA = await authenticatedClient(userA);
    const clientB = await authenticatedClient(userB);
    expect(clientA.auth.getUser()).resolves.toMatchObject({
      data: { user: { id: userA.id } },
    });
    expect(clientB.auth.getUser()).resolves.toMatchObject({
      data: { user: { id: userB.id } },
    });
  });

  it("provides a direct SQL path for resets and privilege assertions", async () => {
    const result = await withDb(async (db) => {
      const res = await db.query<{ role: string }>("select current_user as role");
      return res.rows[0]?.role;
    });
    expect(result).toBe("postgres");
  });

  it("reset removes test users so provisioning starts clean next time", async () => {
    await ensureBothUsers();
    await resetAllUserData();
    const { userCount } = await withDb(async (db) => {
      const res = await db.query<{ count: string }>(
        "select count(*)::text as count from auth.users where email like '%@ml-prep.local'",
      );
      return { userCount: Number(res.rows[0]?.count ?? "0") };
    });
    expect(userCount).toBe(0);
    // Re-provision so other tests (and re-runs) find users available.
    await ensureBothUsers();
  });

  it("anonymous client can reach the auth health endpoint without credentials", async () => {
    const client = anonClient();
    const { data, error } = await client.auth.getSession();
    expect(error).toBeNull();
    expect(data.session).toBeNull();
  });
});
