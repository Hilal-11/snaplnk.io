// lib/authErrors.ts
// Maps Supabase auth error codes to a small set of reasons the sign-up page explains.

export type AuthFailureReason =
  | "other_browser" // PKCE verifier missing: link opened in another browser/device (email IS confirmed)
  | "expired" //       link expired or already used
  | "cancelled" //     user cancelled the OAuth consent screen
  | "missing_code" //  callback opened without a code
  | "unknown";

export function authFailureReason(codeOrMessage: string): AuthFailureReason {
  const v = codeOrMessage.toLowerCase();
  if (/flow_state|code_verifier|code verifier|bad_code|pkce/.test(v)) return "other_browser";
  if (/otp_expired|expired|invalid.*(link|token|grant)|already|used/.test(v)) return "expired";
  if (/access_denied|cancel/.test(v)) return "cancelled";
  if (v === "missing_code") return "missing_code";
  return "unknown";
}

export const AUTH_FAILURE_MESSAGES: Record<AuthFailureReason, { text: string; signIn: boolean }> = {
  other_browser: {
    text: "Your email is confirmed! The link was opened in a different browser, so please sign in here to continue.",
    signIn: true,
  },
  expired: {
    text: "That link has expired or was already used. If you already confirmed your email, just sign in — otherwise sign up again to get a new link.",
    signIn: true,
  },
  cancelled: { text: "Sign-in was cancelled. Choose a method to try again.", signIn: false },
  missing_code: { text: "That sign-in link is incomplete. Please try again.", signIn: false },
  unknown: { text: "Authentication failed. Please try again.", signIn: false },
};

/** Friendlier text for errors returned directly by signUp / signInWithPassword. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("user already registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("password should be") || m.includes("weak password")) return message;
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("signups not allowed")) return "New sign-ups are currently disabled.";
  return message;
}
