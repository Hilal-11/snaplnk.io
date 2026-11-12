// lib/prefs.ts
// Account-level preferences, stored in Supabase auth user_metadata.prefs
// (travel with the user across devices). Pure helpers — safe on server and client.
import { z } from "zod";

export const EXPIRY_OPTIONS = [null, 7, 30, 90, 365] as const;
export type ExpiryDays = (typeof EXPIRY_OPTIONS)[number];

export type UserPrefs = {
  /** New links expire after this many days (null = never). */
  defaultExpiryDays: ExpiryDays;
  /** Copy the new short link to the clipboard right after creating it. */
  autoCopy: boolean;
};

export const DEFAULT_PREFS: UserPrefs = { defaultExpiryDays: null, autoCopy: false };

const prefsSchema = z.object({
  defaultExpiryDays: z.union([z.null(), z.literal(7), z.literal(30), z.literal(90), z.literal(365)]).catch(null),
  autoCopy: z.boolean().catch(false),
});

/** Reads prefs from user_metadata, ignoring anything malformed. */
export function readUserPrefs(metadata: unknown): UserPrefs {
  const raw = (metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).prefs : undefined) ?? {};
  const r = prefsSchema.safeParse({ ...DEFAULT_PREFS, ...(typeof raw === "object" ? raw : {}) });
  return r.success ? r.data : DEFAULT_PREFS;
}

/** ISO expiry for a new link under these prefs (end of the last day), or undefined. */
export function expiryFromPrefs(prefs: UserPrefs, now: Date = new Date()): string | undefined {
  if (!prefs.defaultExpiryDays) return undefined;
  const d = new Date(now);
  d.setDate(d.getDate() + prefs.defaultExpiryDays);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export function expiryLabel(days: ExpiryDays): string {
  return days === null ? "Never" : days === 365 ? "1 year" : `${days} days`;
}

/** Display name: explicit name, then OAuth full name, then the email's local part. */
export function displayNameOf(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): string {
  const m = user?.user_metadata ?? {};
  const pick = (k: string) => (typeof m[k] === "string" && (m[k] as string).trim() ? (m[k] as string).trim() : "");
  return pick("name") || pick("full_name") || (user?.email ? user.email.split("@")[0] : "") || "there";
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
