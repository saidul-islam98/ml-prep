/**
 * Auth view tests (todo.md Task 5 UI behavior): the generic response for
 * registration ambiguity, and the explicit rate-limit message that never
 * discloses whether an address is registered.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthView } from "../../src/auth/AuthView";

const clientStub = vi.hoisted(() => ({
  current: null as unknown as { auth: { signInWithOtp: ReturnType<typeof vi.fn> } },
}));
vi.mock("../../src/lib/supabaseClient", () => ({
  getSupabaseClient: () => clientStub.current,
  isSupabaseConfigured: () => true,
}));

function makeClient(otpResult: { error: { status?: number; message: string } | null }) {
  return {
    auth: { signInWithOtp: vi.fn().mockResolvedValue(otpResult) },
  };
}

function renderForm() {
  return render(<AuthView />);
}

describe("AuthView", () => {
  beforeEach(() => {
    clientStub.current = makeClient({ error: null }) as never;
  });

  async function submitEmail(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText("Email address"), "someone@example.com");
    await user.click(screen.getByRole("button", { name: "Send sign-in link" }));
  }

  it("shows the generic sent response on success", async () => {
    const user = userEvent.setup();
    renderForm();
    await submitEmail(user);
    expect(
      await screen.findByText(/If the address is registered, a sign-in link is on its way/),
    ).toBeInTheDocument();
  });

  it("shows the same generic response when the API rejects for unknown reasons", async () => {
    const user = userEvent.setup();
    clientStub.current = makeClient({
      error: { message: "Signups not allowed for this instance" },
    }) as never;
    renderForm();
    await submitEmail(user);
    expect(
      await screen.findByText(/If the address is registered, a sign-in link is on its way/),
    ).toBeInTheDocument();
  });

  it("surfaces rate limits explicitly without revealing registration status", async () => {
    const user = userEvent.setup();
    clientStub.current = makeClient({
      error: { status: 429, message: "Rate limit exceeded" },
    }) as never;
    renderForm();
    await submitEmail(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Too many sign-in emails/);
    // Rate limiting applies to any address, so this stays ambiguous too.
    expect(alert).not.toHaveTextContent(/registered|does not exist|unknown/i);
  });

  it("detects rate limits by message text as well as status", async () => {
    const user = userEvent.setup();
    clientStub.current = makeClient({
      error: { message: "Email rate limit exceeded" },
    }) as never;
    renderForm();
    await submitEmail(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Too many sign-in emails/);
  });

  it("rejects malformed input before calling the API", async () => {
    const user = userEvent.setup();
    clientStub.current = makeClient({ error: null }) as never;
    renderForm();
    // HTML5 validation blocks empty submits; force a whitespace-only value
    // by clearing the input after typing.
    await user.type(await screen.findByLabelText("Email address"), "a@b.co");
    const input = screen.getByLabelText("Email address") as HTMLInputElement;
    input.value = "   ";
    await user.click(screen.getByRole("button", { name: "Send sign-in link" }));
    expect(clientStub.current.auth.signInWithOtp).not.toHaveBeenCalled();
  });
});
