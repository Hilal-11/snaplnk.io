"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiSearch,
  FiTrash2,
  FiMoreHorizontal,
  FiEye,
  FiLink,
  FiClock,
  FiCalendar,
  FiBarChart2,
  FiTag,
  FiExternalLink,
  FiCopy,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiAlertCircle,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";

interface Link {
  id: string;
  original_url: string;
  short_code: string;
  domain: string;
  title: string | null;
  tags: string[] | null;
  clicks_count: number;
  deleted_at: string | null;
  created_at: string;
  qr_code_url: string;
  favicon_url: string | null;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function RowMenu({
  link,
  onRestore,
  onPermanentDelete,
}: {
  link: Link;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleRestore = async () => {
    try {
      setBusy(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("links")
        .update({ is_deleted: false, deleted_at: null })
        .eq("id", link.id);
      if (error) throw error;
      onRestore(link.id);
    } catch (err) {
      console.error("Restore failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handlePermanentDelete = async () => {
    const confirmed = window.confirm(
      "Permanently delete this link? This action cannot be undone."
    );
    if (!confirmed) return;
    try {
      setBusy(true);
      const supabase = createClient();
      const { error } = await supabase.from("links").delete().eq("id", link.id);
      if (error) throw error;
      onPermanentDelete(link.id);
    } catch (err) {
      console.error("Permanent delete failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={busy}
        className="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition disabled:opacity-40"
        aria-label="More options"
      >
        <FiMoreHorizontal size={18} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="fixed z-[100] w-52 bg-white border border-neutral-200 rounded-2xl shadow-lg shadow-neutral-900/10 py-2 overflow-hidden"
          >
            <button
              onClick={() => { handleRestore(); setOpen(false); }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40"
            >
              <FiRotateCcw size={16} />
              Restore link
            </button>
            <button
              onClick={() => { handlePermanentDelete(); setOpen(false); }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-40"
            >
              <FiXCircle size={16} />
              Delete permanently
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

function DeletedRow({
  link,
  onRestore,
  onPermanentDelete,
}: {
  link: Link;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const fullUrl = getShortUrl(link.short_code);
  const shortUrl = getShortUrlDisplay(link.short_code);

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition">
      <td className="py-4 pl-5 pr-3 align-top min-w-[240px]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-red-50 flex items-center justify-center overflow-hidden mt-0.5 ring-1 ring-red-100">
            <FiTrash2 size={15} className="text-red-400" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-neutral-900 text-sm leading-tight truncate line-through decoration-neutral-300">
                {link.title || shortUrl}
              </span>
              <button
                onClick={copyLink}
                className="p-0.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition shrink-0"
                title="Copy link"
              >
                {copied ? (
                  <FiCheckCircle size={12} className="text-green-600" />
                ) : (
                  <FiCopy size={12} />
                )}
              </button>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-0.5 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition shrink-0"
                title="Open link"
              >
                <FiExternalLink size={12} />
              </a>
            </div>
            <div className="truncate">
              <a
                href={link.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-neutral-500 hover:text-neutral-700"
              >
                {link.original_url}
              </a>
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-3 align-top">
        {link.tags && link.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {link.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 rounded-full px-2 py-0.5 whitespace-nowrap"
              >
                <FiTag size={9} />
                {tag}
              </span>
            ))}
            {link.tags.length > 2 && (
              <span className="text-[11px] font-medium text-neutral-400">
                +{link.tags.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        )}
      </td>
      <td className="py-4 px-3 align-middle text-center">
        <div className="flex items-center justify-center gap-1.5 text-neutral-700">
          <FiEye size={14} className="text-neutral-400 shrink-0" />
          <span className="text-sm font-semibold">
            {link.clicks_count.toLocaleString()}
          </span>
        </div>
      </td>
      <td className="py-4 px-3 align-middle whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <FiCalendar size={12} className="shrink-0" />
          {link.deleted_at
            ? new Date(link.deleted_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : timeAgo(link.created_at)}
        </div>
      </td>
      <td className="py-4 pl-3 pr-5 align-middle text-right">
        <RowMenu
          link={link}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </td>
    </tr>
  );
}

export default function DeletedPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please sign in"); return; }
        const { data, error: err } = await supabase
          .from("links")
          .select("id, original_url, short_code, domain, title, tags, clicks_count, deleted_at, created_at, qr_code_url, favicon_url")
          .eq("owner", user.id)
          .eq("is_deleted", true)
          .order("deleted_at", { ascending: false });
        if (err) throw err;
        setLinks(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load deleted links");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const handleRestore = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handlePermanentDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const filtered = links.filter((link) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      link.short_code.toLowerCase().includes(q) ||
      link.original_url.toLowerCase().includes(q) ||
      (link.title ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Deleted Links</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {links.length} {links.length === 1 ? "link" : "links"} in trash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-full max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5 shadow-sm">
            <FiSearch size={16} className="text-neutral-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deleted links"
              className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-neutral-400">
              <FiBarChart2 size={28} />
            </div>
            <p className="mt-4 text-sm text-neutral-500">Loading deleted links...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
            <FiAlertCircle size={28} className="text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-700 font-semibold text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={22} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              {search ? "No deleted links found" : "Trash is empty"}
            </h3>
            <p className="text-sm text-neutral-500">
              {search
                ? "Try a different search term."
                : "Deleted links will appear here. You can restore them within 30 days."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="py-3.5 pl-5 pr-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Link
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[100px]">
                      Tags
                    </th>
                    <th className="py-3.5 px-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[80px]">
                      Clicks
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[110px]">
                      Deleted
                    </th>
                    <th className="py-3.5 pl-3 pr-5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[70px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((link) => (
                    <DeletedRow
                      key={link.id}
                      link={link}
                      onRestore={handleRestore}
                      onPermanentDelete={handlePermanentDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
