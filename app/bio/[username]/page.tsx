// app/bio/[username]/page.tsx
// Public bio page. Served at /@username via the rewrite in next.config.ts.
// Reads ONLY the published snapshot through bio_get_public_page (security definer).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import BioRenderer from "@/components/bio/BioRenderer";
import { normalizeUsername } from "@/lib/bio/reserved";
import { parseSnapshot } from "@/lib/bio/snapshot";
import { getBaseUrl } from "@/lib/utils/baseUrl";

type Params = { params: Promise<{ username: string }> };

// TODO(Phase 3.3): Redis cache-aside (bio:{username}) + view beacon. Rendered per request for now.
const loadPage = cache(async (rawUsername: string) => {
  const username = normalizeUsername(decodeURIComponent(rawUsername));
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bio_get_public_page", { p_username: username });
  if (error) {
    console.error("[bio page] load", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.published) return null;
  return { username: row.username as string, snapshot: parseSnapshot(row.published) };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const page = await loadPage(username);
  if (!page) return { title: "Page not found · Snaplnk", robots: { index: false } };

  const name = page.snapshot.profile.display_name || `@${page.username}`;
  const url = `${getBaseUrl()}/@${page.username}`;
  const description = page.snapshot.profile.bio || `${name} on Snaplnk`;
  return {
    title: `${name} (@${page.username}) · Snaplnk`,
    description,
    alternates: { canonical: url },
    openGraph: { title: name, description, url, type: "profile" },
    twitter: { card: "summary", title: name, description },
  };
}

export default async function PublicBioPage({ params }: Params) {
  const { username } = await params;
  const page = await loadPage(username);
  if (!page) notFound();

  const { profile, theme, doc } = page.snapshot;
  return (
    <BioRenderer
      profile={{ displayName: profile.display_name, bio: profile.bio }}
      theme={theme}
      blocks={doc.blocks}
      username={page.username}
      mode="public"
      frame="device"
    />
  );
}
