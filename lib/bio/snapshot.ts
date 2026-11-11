// lib/bio/snapshot.ts
// The published snapshot written by bio_publish_page (see the RPC migration):
//   { schema_version, profile: { display_name, bio, avatar_path }, theme, doc }
import { parseDocumentLenient, type BioDocument } from "./blocks";
import { parseThemeOrDefault, type Theme } from "./theme";

export type PublishedSnapshot = {
  profile: { display_name: string; bio: string; avatar_path: string | null };
  theme: Theme;
  doc: BioDocument;
};

/** Defensive parse of a stored snapshot (invalid blocks dropped, bad theme -> default). */
export function parseSnapshot(value: unknown): PublishedSnapshot {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const p = (v.profile && typeof v.profile === "object" ? v.profile : {}) as Record<string, unknown>;
  return {
    profile: {
      display_name: typeof p.display_name === "string" ? p.display_name.slice(0, 60) : "",
      bio: typeof p.bio === "string" ? p.bio.slice(0, 160) : "",
      avatar_path: typeof p.avatar_path === "string" ? p.avatar_path : null,
    },
    theme: parseThemeOrDefault(v.theme),
    doc: parseDocumentLenient(v.doc),
  };
}

/** JSON with sorted keys, so client objects and Postgres jsonb compare equal. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export type PageContent = {
  display_name: string;
  bio: string;
  avatar_path: string | null;
  theme: unknown;
  draft: unknown;
};

/** True when the draft (profile, theme or blocks) differs from what is published. */
export function hasUnpublishedChanges(page: PageContent, published: unknown): boolean {
  if (!published || typeof published !== "object") return true;
  const pub = published as Record<string, unknown>;
  const current = {
    profile: { display_name: page.display_name, bio: page.bio, avatar_path: page.avatar_path },
    theme: page.theme,
    doc: page.draft,
  };
  return (
    stableStringify(current) !== stableStringify({ profile: pub.profile, theme: pub.theme, doc: pub.doc })
  );
}
