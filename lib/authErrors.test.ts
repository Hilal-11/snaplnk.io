import { describe, expect, it } from "vitest";
import { AUTH_FAILURE_MESSAGES, authFailureReason, friendlyAuthError } from "./authErrors";

describe("authFailureReason", () => {
  it.each([
    ["flow_state_not_found", "other_browser"],
    ["bad_code_verifier", "other_browser"],
    ["invalid request: both auth code and code verifier should be non-empty", "other_browser"],
    ["otp_expired", "expired"],
    ["Email link is invalid or has expired", "expired"],
    ["access_denied", "cancelled"],
    ["missing_code", "missing_code"],
    ["server_error", "unknown"],
  ] as const)("%s → %s", (input, reason) => {
    expect(authFailureReason(input)).toBe(reason);
  });

  it("sends people with a confirmed account to sign in", () => {
    expect(AUTH_FAILURE_MESSAGES.other_browser.signIn).toBe(true);
    expect(AUTH_FAILURE_MESSAGES.expired.signIn).toBe(true);
    expect(AUTH_FAILURE_MESSAGES.unknown.signIn).toBe(false);
  });
});

describe("friendlyAuthError", () => {
  it("rewrites common Supabase messages", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe("Incorrect email or password.");
    expect(friendlyAuthError("User already registered")).toMatch(/already exists/);
    expect(friendlyAuthError("Email not confirmed")).toMatch(/confirm your email/);
    expect(friendlyAuthError("Something new")).toBe("Something new");
  });
});
