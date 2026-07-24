"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiTag,
  FiLink,
  FiMousePointer,
  FiBarChart2,
  FiAlertCircle,
  FiHash,
  FiExternalLink,
} from "react-icons/fi";

interface TagGroup {
  name: string;
  linkCount: number;
  totalClicks: number;
  links: { id: string; short_code: string; domain: string; title: string | null; clicks_count: number }[];
}

function TagCard({ tag, index }: { tag: TagGroup; index: number }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] hover:shadow-md hover:border-neutral-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
            <FiTag size={18} className="text-neutral-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <FiHash size={12} className="text-neutral-400" />
              {tag.name}
            </h3>
            <p className="text-xs text-neutral-500">
              {tag.linkCount} {tag.linkCount === 1 ? "link" : "links"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          <FiMousePointer size={13} className="text-neutral-400" />
          {tag.totalClicks.toLocaleString()}
        </div>
      </div>

      <div className="space-y-1.5">
        {tag.links.slice(0, 3).map((link) => {
          const shortUrl = `${link.domain}/${link.short_code}`;
          return (
            <a
              key={link.id}
              href={`https://${shortUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs hover:bg-neutral-100 transition-colors group"
            >
              <span className="font-medium text-neutral-700 truncate group-hover:text-neutral-900">
                {link.title || shortUrl}
              </span>
              <span className="flex items-center gap-1 text-neutral-400 shrink-0 ml-2">
                <FiMousePointer size={10} />
                {link.clicks_count}
              </span>
            </a>
          );
        })}
        {tag.links.length > 3 && (
          <p className="text-xs text-neutral-400 text-center pt-0.5">
            +{tag.links.length - 3} more {tag.links.length - 3 === 1 ? "link" : "links"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TagsPage() {
  const [links, setLinks] = useState<
    { id: string; title: string | null; short_code: string; domain: string; tags: string[] | null; clicks_count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"links" | "clicks">("clicks");

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please sign in"); return; }
        const { data, error: err } = await supabase
          .from("links")
          .select("id, title, short_code, domain, tags, clicks_count")
          .eq("owner", user.id)
          .eq("is_deleted", false)
          .not("tags", "is", null);
        if (err) throw err;
        setLinks(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load tags");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const tagGroups = useMemo(() => {
    const groups = new Map<string, TagGroup>();
    links.forEach((link) => {
      (link.tags || []).forEach((tag) => {
        const normalized = tag.trim();
        if (!normalized) return;
        if (!groups.has(normalized)) {
          groups.set(normalized, { name: normalized, linkCount: 0, totalClicks: 0, links: [] });
        }
        const group = groups.get(normalized)!;
        group.linkCount++;
        group.totalClicks += link.clicks_count || 0;
        group.links.push({
          id: link.id,
          short_code: link.short_code,
          domain: link.domain,
          title: link.title,
          clicks_count: link.clicks_count || 0,
        });
      });
    });
    return Array.from(groups.values());
  }, [links]);

  const sortedAndFiltered = useMemo(() => {
    let result = tagGroups;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) =>
      sortBy === "clicks" ? b.totalClicks - a.totalClicks : b.linkCount - a.linkCount
    );
  }, [tagGroups, search, sortBy]);

  const totalTags = tagGroups.length;
  const totalTaggedLinks = links.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Tags</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {totalTags} {totalTags === 1 ? "tag" : "tags"} across {totalTaggedLinks} {totalTaggedLinks === 1 ? "link" : "links"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="w-full max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5 shadow-sm">
            <FiSearch size={16} className="text-neutral-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags"
              className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            {(["clicks", "links"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  sortBy === s
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {s === "clicks" ? "Most clicks" : "Most links"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-neutral-400">
              <FiBarChart2 size={28} />
            </div>
            <p className="mt-4 text-sm text-neutral-500">Organizing tags...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
            <FiAlertCircle size={28} className="text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-700 font-semibold text-sm">{error}</p>
          </div>
        ) : sortedAndFiltered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <FiTag size={22} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              {search ? "No tags found" : "No tags yet"}
            </h3>
            <p className="text-sm text-neutral-500">
              {search
                ? "Try a different search term."
                : "Add tags to your links to organize and categorize them."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAndFiltered.map((tag, idx) => (
              <TagCard key={tag.name} tag={tag} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
