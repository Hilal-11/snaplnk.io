"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_LINK_COLUMNS } from "@/config/linkColumns";
import type { LinkItem, LinkPatch } from "./types";

async function fetchUserLinks(deleted: boolean): Promise<{ links: LinkItem[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { links: null, error: "Please sign in to view your links" };
    const { data, error } = await supabase
      .from("links")
      .select(PUBLIC_LINK_COLUMNS)
      .eq("owner", user.id)
      .eq("is_deleted", deleted)
      .order(deleted ? "deleted_at" : "created_at", { ascending: false });
    if (error) throw error;
    return { links: (data ?? []) as unknown as LinkItem[], error: null };
  } catch (err) {
    console.error("Error fetching links:", err);
    return { links: null, error: err instanceof Error ? err.message : "Failed to load links" };
  }
}

/**
 * Loads the signed-in user's links (live ones, or the trash with { deleted: true}) and exposes mutations that go
 * through PATCH /api/links/:id so timestamps (archived_at, deleted_at, ...) stay in sync.
 */
export function useLinks({ deleted = false }: { deleted?: boolean } = {}) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const linksRef = useRef<LinkItem[]>([]);
  useEffect(() => {
    linksRef.current = links;
  }, [links]);

  const fetchLinks = useCallback(
    () =>
      fetchUserLinks(deleted).then((r) => {
        setError(r.error);
        if (r.links) setLinks(r.links);
        setLoading(false);
      }),
    [deleted]
  );

  useEffect(() => {
    let cancelled = false;
    fetchUserLinks(deleted).then((r) => {
      if (cancelled) return;
      setError(r.error);
      if (r.links) setLinks(r.links);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [deleted]);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchLinks();
  }, [fetchLinks]);

  /** PATCH a link. Applies `optimistic` locally first and rolls back on failure. */
  const updateLink = useCallback(
    async (id: string, patch: LinkPatch, optimistic?: Partial<LinkItem>) => {
      const previous = optimistic ? linksRef.current.find((l) => l.id === id) : undefined;
      if (optimistic) {
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...optimistic } : l)));
      }
      try {
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message ?? "Update failed");

        // Moving between live list and trash removes it from this list.
        if (patch.isDeleted !== undefined && patch.isDeleted !== deleted) {
          setLinks((prev) => prev.filter((l) => l.id !== id));
        } else if (json.data) {
          setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...json.data } : l)));
        }
        return true;
      } catch (err) {
        console.error("Link update failed:", err);
        if (previous) {
          const snapshot = previous;
          setLinks((prev) => prev.map((l) => (l.id === id ? snapshot : l)));
        }
        return false;
      }
    },
    [deleted]
  );

  /** Permanently delete (DELETE /api/links/:id also removes the QR image from Cloudinary). */
  const purgeLink = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setLinks((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      console.error("Link purge failed:", err);
      return false;
    }
  }, []);

  return { links, loading, error, reload, updateLink, purgeLink };
}
