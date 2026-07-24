"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiCopy,
  FiExternalLink,
  FiSearch,
  FiMoreHorizontal,
  FiBarChart2,
  FiTrash2,
  FiArchive,
  FiLink,
  FiEye,
  FiUsers,
  FiShare2,
  FiEdit2,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiTag,
  FiCalendar,
  FiMapPin,
  FiMonitor,
  FiSmartphone,
  FiClock,
} from "react-icons/fi";

interface Link {
  id: string;
  owner: string;
  original_url: string;
  short_code: string;
  domain: string;
  is_custom_alias: boolean;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  is_password_protected: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  clicks_count: number;
  unique_clicks_count: number;
  last_clicked_at: string | null;
  favicon_url: string | null;
  qr_code_url: string;
  qr_code_public_id: string | null;
  created_at: string;
  updated_at: string;
  archived_link: boolean;
  is_deleted: boolean;
}

interface ClickEvent {
  id: string;
  link_id: string;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer_domain: string | null;
  clicked_at: string;
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

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  try {
    return String.fromCodePoint(
      ...code
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
  } catch {
    return "";
  }
}

/* ---------- Dropdown "..." menu (portal-based) ---------- */
function LinkMenu({
  link,
  onArchiveToggle,
  onDelete,
}: {
  link: Link;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const shortUrl = getShortUrl(link.short_code);

  const handleViewAnalytics = () => {
    router.push(`/dashboard/analytics/${link.id}`);
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: link.title ?? shortUrl,
          url: shortUrl,
        });
      } else {
        await navigator.clipboard.writeText(shortUrl);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDownloadQR = async () => {
    if (!link.qr_code_url) return;
    try {
      setBusy(true);
      const res = await fetch(link.qr_code_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${link.short_code}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("QR download failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/links/${link.id}/edit`);
  };

  const handleArchiveToggle = async () => {
    try {
      setBusy(true);
      const supabase = createClient();
      const nextValue = !link.archived_link;
      const { error } = await supabase
        .from("links")
        .update({ archived_link: nextValue })
        .eq("id", link.id);
      if (error) throw error;
      onArchiveToggle(link.id, nextValue);
    } catch (err) {
      console.error("Archive toggle failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this link? This action can't be undone."
    );
    if (!confirmed) return;
    try {
      setBusy(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("links")
        .update({ is_deleted: true })
        .eq("id", link.id);
      if (error) throw error;
      onDelete(link.id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const items = [
    { label: "View analytics", icon: FiBarChart2, onClick: handleViewAnalytics },
    { label: "Share link", icon: FiShare2, onClick: handleShare },
    {
      label: "Download QR code",
      icon: FiDownload,
      onClick: handleDownloadQR,
      disabled: !link.qr_code_url,
    },
    { label: "Edit link", icon: FiEdit2, onClick: handleEdit },
    {
      label: link.archived_link ? "Unarchive" : "Archive",
      icon: FiArchive,
      onClick: handleArchiveToggle,
    },
    {
      label: "Delete link",
      icon: FiTrash2,
      onClick: handleDelete,
      danger: true,
    },
  ];

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
            className="fixed z-[100] w-56 bg-white border border-neutral-200 rounded-2xl shadow-lg shadow-neutral-900/10 py-2 overflow-hidden"
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

/* ---------- Status badge ---------- */
function StatusBadge({ link }: { link: Link }) {
  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
  const isMaxClicksReached =
    link.max_clicks !== null && link.clicks_count >= (link.max_clicks ?? 0);

  if (isExpired || isMaxClicksReached) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
        <FiAlertCircle size={12} />
        {isExpired ? "Expired" : "Limit reached"}
      </span>
    );
  }
  if (link.archived_link) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">
        <FiArchive size={12} />
        Archived
      </span>
    );
  }
  if (link.is_active) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 bg-neutral-100 rounded-full px-2.5 py-1">
        <FiCheckCircle size={12} />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-full px-2.5 py-1">
      <FiAlertCircle size={12} />
      Inactive
    </span>
  );
}

/* ---------- Table row ---------- */
function LinkRow({
  link,
  latestClick,
  onArchiveToggle,
  onDelete,
}: {
  link: Link;
  latestClick: ClickEvent | null;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const fullUrl = getShortUrl(link.short_code);
  const shortUrl = getShortUrlDisplay(link.short_code);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const daysUntilExpiry = link.expires_at
    ? Math.ceil(
        (new Date(link.expires_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const locationLabel = latestClick
    ? [latestClick.city, latestClick.country].filter(Boolean).join(", ")
    : null;

  const DeviceIcon =
    latestClick?.device_type === "Mobile" ||
    latestClick?.device_type === "Tablet"
      ? FiSmartphone
      : FiMonitor;

  const browserOs = latestClick
    ? [latestClick.browser, latestClick.os].filter(Boolean).join(" on ")
    : null;

  return (
    <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition">
      {/* Link — compact with location */}
      <td className="py-4 pl-5 pr-3 align-top min-w-[240px]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden mt-0.5 ring-1 ring-neutral-200/50">
            {link.favicon_url ? (
              <img
                src={link.favicon_url}
                alt=""
                width={16}
                height={16}
                className="rounded"
              />
            ) : (
              <FiLink size={15} className="text-neutral-500" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-neutral-900 text-sm leading-tight truncate">
                {shortUrl}
              </span>
              <button
                onClick={copyToClipboard}
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
                title="Open short link"
              >
                <FiExternalLink size={12} />
              </a>
              {link.is_password_protected && (
                <FiLock size={11} className="text-neutral-400 shrink-0" />
              )}
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

            {link.title && (
              <p className="text-[11px] text-neutral-400 truncate">
                {link.title}
              </p>
            )}

            {latestClick ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500 pt-0.5">
                {locationLabel && (
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <FiMapPin size={10} className="text-neutral-400 shrink-0" />
                    {countryFlag(latestClick.country_code)}
                    {locationLabel}
                  </span>
                )}
                {browserOs && (
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <DeviceIcon size={10} className="text-neutral-400 shrink-0" />
                    {browserOs}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 shrink-0">
                  <FiClock size={10} className="text-neutral-400 shrink-0" />
                  {timeAgo(latestClick.clicked_at)}
                </span>
              </div>
            ) : link.last_clicked_at ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 pt-0.5">
                <FiClock size={10} className="text-neutral-400 shrink-0" />
                {timeAgo(link.last_clicked_at)}
              </span>
            ) : null}
          </div>
        </div>
      </td>

      {/* QR Code */}
      <td className="py-4 px-3 align-top w-[86px] shrink-0">
        {link.qr_code_url ? (
          <a
            href={link.qr_code_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open QR code"
          >
            <img
              src={link.qr_code_url}
              alt={`QR for ${link.short_code}`}
              width={56}
              height={56}
              className="rounded-lg border border-neutral-100 hover:border-neutral-300 transition"
            />
          </a>
        ) : (
          <div className="w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center">
            <FiLink size={16} className="text-neutral-300" />
          </div>
        )}
      </td>

      {/* Tags */}
      <td className="py-4 px-3 align-top min-w-[120px]">
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

      {/* Clicks */}
      <td className="py-4 px-3 align-top min-w-[100px]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-neutral-700">
            <FiEye size={14} className="text-neutral-400 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap">
              {link.clicks_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-500">
            <FiUsers size={12} className="text-neutral-400 shrink-0" />
            <span className="text-xs whitespace-nowrap">
              {link.unique_clicks_count.toLocaleString()}
            </span>
          </div>
          {link.max_clicks && (
            <p className="text-[11px] text-neutral-400 whitespace-nowrap">
              {((link.clicks_count / link.max_clicks) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-3 align-top min-w-[110px]">
        <StatusBadge link={link} />
      </td>

      {/* Created */}
      <td className="py-4 px-3 align-top whitespace-nowrap min-w-[90px]">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <FiCalendar size={12} className="shrink-0" />
          {new Date(link.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </td>

      {/* Expires */}
      <td className="py-4 px-3 align-top whitespace-nowrap min-w-[90px]">
        {link.expires_at ? (
          <div>
            <p className="text-xs text-neutral-500">
              {new Date(link.expires_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
            {daysUntilExpiry !== null && (
              <p
                className={`text-[11px] mt-0.5 font-medium ${
                  daysUntilExpiry <= 7
                    ? "text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                {daysUntilExpiry <= 0
                  ? "Expired"
                  : `${daysUntilExpiry}d left`}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 pl-3 pr-5 align-top text-right min-w-[70px]">
        <LinkMenu
          link={link}
          onArchiveToggle={onArchiveToggle}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

/* ---------- Page ---------- */
export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [clickEventsMap, setClickEventsMap] = useState<
    Record<string, ClickEvent>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Please sign in to view your links");
          return;
        }

        const { data, error: err } = await supabase
          .from("links")
          .select("*")
          .eq("owner", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (err) throw err;
        const linksData = data || [];
        setLinks(linksData);

        const linkIds = linksData.map((l) => l.id);
        if (linkIds.length > 0) {
          const { data: clickData } = await supabase
            .from("click_events")
            .select("*")
            .in("link_id", linkIds)
            .order("clicked_at", { ascending: false });

          const map: Record<string, ClickEvent> = {};
          clickData?.forEach((ce) => {
            if (!map[ce.link_id]) {
              map[ce.link_id] = ce;
            }
          });
          setClickEventsMap(map);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load links");
        console.error("Error fetching links:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleArchiveToggle = (id: string, archived: boolean) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, archived_link: archived } : l))
    );
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const filteredLinks = links.filter((link) => {
    if (activeFilter === "active" && !link.is_active) return false;
    if (activeFilter === "inactive" && link.is_active) return false;
    if (activeFilter === "archived" && !link.archived_link) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        link.short_code.toLowerCase().includes(q) ||
        link.original_url.toLowerCase().includes(q) ||
        (link.title ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filters = ["all", "active", "inactive", "archived"];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-full max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5 shadow-sm">
            <FiSearch size={16} className="text-neutral-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for links"
              className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                activeFilter === f
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-neutral-400">
              <FiBarChart2 size={28} />
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Loading your links...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
            <FiAlertCircle
              size={28}
              className="text-neutral-400 mx-auto mb-3"
            />
            <p className="text-neutral-700 font-semibold text-sm">{error}</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <FiLink size={22} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              No links found
            </h3>
            <p className="text-sm text-neutral-500">
              Create your first shortened link to get started.
            </p>
          </div>
        ) : (
          // overflow-hidden here is what makes the rounded-2xl corners actually
          // clip the table instead of showing a square edge poking through.
          // The scroll container is nested one level in, separately, so
          // rounding + horizontal scroll can coexist.
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {/* No table-fixed / percentage widths — those squish columns
                  unreadably on narrow screens instead of triggering scroll.
                  min-w-[880px] + per-column min-widths force a real
                  horizontal scrollbar below that breakpoint instead. */}
              <table className="w-full min-w-[880px] border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="py-3.5 pl-5 pr-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[240px]">
                      Link
                    </th>
                    <th className="py-3.5 px-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[86px]">
                      QR
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[120px]">
                      Tags
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[100px]">
                      Clicks
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[110px]">
                      Status
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[90px]">
                      Created
                    </th>
                    <th className="py-3.5 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[90px]">
                      Expires
                    </th>
                    <th className="py-3.5 pl-3 pr-5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[70px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      latestClick={clickEventsMap[link.id] || null}
                      onArchiveToggle={handleArchiveToggle}
                      onDelete={handleDelete}
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