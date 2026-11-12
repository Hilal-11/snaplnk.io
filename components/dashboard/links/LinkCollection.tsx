"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  FiAlertCircle,
  FiArchive,
  FiArrowLeft,
  FiClock,
  FiEye,
  FiEyeOff,
  FiLink,
  FiRefreshCw,
  FiRotateCcw,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import { AnimatePresence, motion } from "motion/react";
import LinkCard, { type LinkCardHandlers } from "./LinkCard";
import { ConfirmDialog, EditLinkDialog, LinkDetailsDialog, QrPreviewDialog } from "./LinkDialogs";
import { CreateButton, PageTitle, SearchInput, ViewToggle } from "./CollectionToolbar";
import { useLinks } from "./useLinks";
import type { CardVariant, CollectionScope, LinkItem, ViewMode } from "./types";
import { displayTitle, getLinkStatus } from "./utils";

type Filter = "all" | "active" | "disabled" | "expired" | "hidden";
type Sort = "newest" | "oldest" | "clicks";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "disabled", label: "Disabled" },
  { key: "expired", label: "Expired" },
  { key: "hidden", label: "Hidden" },
];

const GRID_CLASS: Record<ViewMode, string> = {
  list: "grid grid-cols-1 gap-3",
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  grid4: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
};

type Copy = {
  title: string;
  subtitle: string;
  search: string;
  noun: string;
  emptyTitle: string;
  emptyText: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const VARIANT_COPY: Record<CardVariant, Copy & { create: string; href: string }> = {
  link: {
    title: "Links",
    subtitle: "Manage, tag and track every short link you've created.",
    create: "Create Link",
    href: "/dashboard/links/new",
    search: "Search links, URLs or tags",
    noun: "link",
    emptyTitle: "No links yet",
    emptyText: "Create your first link to get started.",
    icon: FiLink,
  },
  qr: {
    title: "QR Codes",
    subtitle: "Every QR code points to a trackable short link — download, share and measure scans.",
    create: "Create QR Code",
    href: "/dashboard/qr-codes/new",
    search: "Search QR codes",
    noun: "QR code",
    emptyTitle: "No QR codes yet",
    emptyText: "Create your first QR code to get started.",
    icon: TbQrcode,
  },
};

const SCOPE_COPY: Record<Exclude<CollectionScope, "all">, Copy> = {
  archived: {
    title: "Archived Links",
    subtitle: "Hidden from your main list but still redirecting. Unarchive any time.",
    search: "Search archived links",
    noun: "archived link",
    emptyTitle: "Nothing archived",
    emptyText: "Archive (hide) links from the Links page to tidy up without breaking them.",
    icon: FiArchive,
  },
  expired: {
    title: "Expired Links",
    subtitle: "Links past their expiry date or click limit. Extend or reactivate them to bring them back.",
    search: "Search expired links",
    noun: "expired link",
    emptyTitle: "No expired links",
    emptyText: "Links with an expiry date or a click limit show up here once they run out.",
    icon: FiClock,
  },
  deleted: {
    title: "Deleted Links",
    subtitle: "Deleted links stop redirecting. Restore them, or delete forever to free the short code.",
    search: "Search deleted links",
    noun: "deleted link",
    emptyTitle: "Trash is empty",
    emptyText: "Links you delete land here first, so you can change your mind.",
    icon: FiTrash2,
  },
};

const noopSubscribe = () => () => {};

function readView(key: string): ViewMode {
  try {
    const v = localStorage.getItem(key);
    if (v === "list" || v === "grid2" || v === "grid4") return v;
  } catch {}
  return "list";
}

const isExpired = (l: LinkItem) => {
  const s = getLinkStatus(l);
  return s === "expired" || s === "limit";
};

export default function LinkCollection({
  variant,
  scope = "all",
  initialTag = null,
}: {
  variant: CardVariant;
  scope?: CollectionScope;
  initialTag?: string | null;
}) {
  const scoped = scope !== "all";
  const copy: Copy = scoped ? SCOPE_COPY[scope] : VARIANT_COPY[variant];
  const createCopy = VARIANT_COPY[variant];
  const viewKey = `snaplnk:view:${scoped ? scope : variant}`;
  const { links: allLinks, loading, error, updateLink, purgeLink } = useLinks({ deleted: scope === "deleted" });

  const [viewOverride, setViewOverride] = useState<ViewMode | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [tagFilter, setTagFilter] = useState<string | null>(initialTag);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [details, setDetails] = useState<LinkItem | null>(null);
  const [qrView, setQrView] = useState<LinkItem | null>(null);
  const [deleting, setDeleting] = useState<LinkItem[] | null>(null);
  const [purging, setPurging] = useState<LinkItem[] | null>(null);

  // Saved layout preference (server snapshot is "list" to keep hydration stable).
  const storedView = useSyncExternalStore(
    noopSubscribe,
    () => readView(viewKey),
    () => "list" as ViewMode
  );
  const view = viewOverride ?? storedView;
  function changeView(v: ViewMode) {
    setViewOverride(v);
    try {
      localStorage.setItem(viewKey, v);
    } catch {}
  }

  const links = useMemo(() => {
    if (scope === "archived") return allLinks.filter((l) => l.archived_link && !isExpired(l));
    if (scope === "expired") return allLinks.filter(isExpired);
    if (scope === "deleted") return allLinks;
    return variant === "qr" ? allLinks.filter((l) => l.qr_code_url) : allLinks;
  }, [allLinks, variant, scope]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, active: 0, disabled: 0, expired: 0, hidden: 0 };
    links.forEach((l) => {
      const s = getLinkStatus(l);
      if (s !== "hidden") c.all++;
      if (s === "limit") c.expired++;
      else c[s]++;
    });
    return c;
  }, [links]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = links.filter((l) => {
      if (!scoped) {
        const s = getLinkStatus(l);
        if (filter === "all" && s === "hidden") return false;
        if (filter === "expired" && s !== "expired" && s !== "limit") return false;
        if (filter !== "all" && filter !== "expired" && s !== filter) return false;
      }
      if (tagFilter && !(l.tags ?? []).includes(tagFilter)) return false;
      if (!q) return true;
      return (
        l.short_code.toLowerCase().includes(q) ||
        l.original_url.toLowerCase().includes(q) ||
        (l.title ?? "").toLowerCase().includes(q) ||
        (l.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
    // Trash sorts by deletion time; other scopes by creation.
    const time = (l: LinkItem) => new Date((scope === "deleted" && l.deleted_at) || l.created_at).getTime();
    out.sort((a, b) => {
      if (sort === "clicks") return b.clicks_count - a.clicks_count;
      return sort === "newest" ? time(b) - time(a) : time(a) - time(b);
    });
    return out;
  }, [links, search, filter, sort, tagFilter, scoped, scope]);

  const reactivate = (l: LinkItem) =>
    updateLink(l.id, { expiresAt: null, maxClicks: null, isActive: true }, { expires_at: null, max_clicks: null, is_active: true });
  const restore = (l: LinkItem) => updateLink(l.id, { isDeleted: false });

  const handlers: LinkCardHandlers = {
    onEdit: setEditing,
    onDetails: setDetails,
    onViewQr: setQrView,
    onDelete: (l) => setDeleting([l]),
    onToggleHidden: (l) =>
      updateLink(l.id, { archivedLink: !l.archived_link }, { archived_link: !l.archived_link }),
    onToggleActive: (l) => updateLink(l.id, { isActive: !l.is_active }, { is_active: !l.is_active }),
    onTagsChange: (l, tags) => updateLink(l.id, { tags }, { tags }),
    onTagClick: setTagFilter,
    onRestore: restore,
    onPurge: (l) => setPurging([l]),
    onReactivate: reactivate,
  };

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedLinks = visible.filter((l) => selected.has(l.id));
  const allSelected = visible.length > 0 && selectedLinks.length === visible.length;
  const bulkHide = selectedLinks.some((l) => !l.archived_link);

  async function bulk(fn: (l: LinkItem) => Promise<unknown>) {
    await Promise.all(selectedLinks.map(fn));
    setSelected(new Set());
  }

  const Empty = copy.icon;
  const filtered = search || tagFilter || (!scoped && filter !== "all");

  const bulkBtn = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-white/10";
  const dangerBtn = `${bulkBtn} text-red-400 dark:text-[oklch(0.5_0.2_25)]`;

  return (
    <div className="max-w-full mx-auto">
      {scoped && (
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <FiArrowLeft size={14} /> All links
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageTitle title={copy.title} subtitle={copy.subtitle} count={loading ? undefined : links.length} />
        {!scoped && <CreateButton href={createCopy.href} label={createCopy.create} />}
        {scope === "deleted" && links.length > 0 && (
          <button
            onClick={() => setPurging(links)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.97]"
          >
            <FiTrash2 size={14} /> Empty trash
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={copy.search} />
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort"
            className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-medium text-neutral-700 outline-none focus:border-neutral-400"
          >
            <option value="newest">{scope === "deleted" ? "Recently deleted" : "Newest first"}</option>
            <option value="oldest">Oldest first</option>
            <option value="clicks">Most clicks</option>
          </select>
          <ViewToggle value={view} onChange={changeView} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {!scoped && (
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    active ? "text-white" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={`filter-pill-${variant}`}
                      className="absolute inset-0 rounded-lg btn-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                  {!loading && (
                    <span
                      className={`relative z-10 tabular-nums rounded-md px-1 text-[10px] ${
                        active ? "bg-brand text-white" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {counts[f.key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {tagFilter && (
          <span className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
            <FiTag size={12} /> {tagFilter}
            <button onClick={() => setTagFilter(null)} aria-label="Clear tag filter" className="p-0.5 rounded-md hover:bg-blue-100">
              <FiX size={12} />
            </button>
          </span>
        )}
        {!loading && visible.length > 0 && (
          <label className="ml-auto flex items-center gap-2 text-xs font-medium text-neutral-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((l) => l.id)))}
              className="w-4 h-4 rounded-md accent-[var(--brand)]"
            />
            Select all
          </label>
        )}
      </div>

      {/* Bulk bar */}
      <AnimatePresence>
        {selectedLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="sticky top-2 lg:top-20 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl btn-primary text-white px-4 py-2.5 shadow-lg"
          >
            <span className="flex items-center gap-2 text-sm font-semibold mr-2">
              <motion.span
                key={selectedLinks.length}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="inline-flex min-w-6 h-6 items-center justify-center rounded-md bg-brand px-1.5 text-xs text-white tabular-nums"
              >
                {selectedLinks.length}
              </motion.span>
              selected
            </span>

            {scope === "deleted" ? (
              <>
                <button onClick={() => bulk(restore)} className={bulkBtn}>
                  <FiRotateCcw size={13} /> Restore
                </button>
                <button onClick={() => setPurging(selectedLinks)} className={dangerBtn}>
                  <FiTrash2 size={13} /> Delete forever
                </button>
              </>
            ) : scope === "archived" ? (
              <>
                <button
                  onClick={() => bulk((l) => updateLink(l.id, { archivedLink: false }, { archived_link: false }))}
                  className={bulkBtn}
                >
                  <FiEye size={13} /> Unarchive
                </button>
                <button onClick={() => setDeleting(selectedLinks)} className={dangerBtn}>
                  <FiTrash2 size={13} /> Move to trash
                </button>
              </>
            ) : scope === "expired" ? (
              <>
                <button onClick={() => bulk(reactivate)} className={bulkBtn}>
                  <FiRefreshCw size={13} /> Reactivate
                </button>
                <button onClick={() => setDeleting(selectedLinks)} className={dangerBtn}>
                  <FiTrash2 size={13} /> Move to trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => bulk((l) => updateLink(l.id, { archivedLink: bulkHide }, { archived_link: bulkHide }))}
                  className={bulkBtn}
                >
                  {bulkHide ? <FiEyeOff size={13} /> : <FiEye size={13} />} {bulkHide ? "Hide" : "Unhide"}
                </button>
                <button onClick={() => setDeleting(selectedLinks)} className={dangerBtn}>
                  <FiTrash2 size={13} /> Delete
                </button>
              </>
            )}

            <button onClick={() => setSelected(new Set())} className="ml-auto p-1.5 rounded-md hover:bg-white/10" aria-label="Clear selection">
              <FiX size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white px-8 py-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_4px_12px_rgba(0,0,0,0.05)]">
            <Spinner className="size-5 text-neutral-500" />
            <p className="text-sm font-medium text-neutral-600">Loading your {copy.noun}s...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
          <FiAlertCircle size={28} className="text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-700 font-semibold text-sm">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="relative isolate overflow-hidden bg-white border border-dashed border-neutral-300 rounded-2xl p-14 text-center">
          <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
          <div className="relative w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mx-auto mb-4 -rotate-3">
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand ring-2 ring-white" />
            <Empty size={24} className="text-white" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {filtered ? `No ${copy.noun}s match` : copy.emptyTitle}
          </h3>
          <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto">
            {filtered ? "Try a different search, filter or tag." : copy.emptyText}
          </p>
          {!filtered && (
            <div className="flex justify-center">
              {scoped ? (
                <Link
                  href="/dashboard/links"
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <FiLink size={14} /> Go to links
                </Link>
              ) : (
                <CreateButton href={createCopy.href} label={createCopy.create} />
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.div layout className={GRID_CLASS[view]}>
          <AnimatePresence initial={true} mode="popLayout">
            {visible.map((link, i) => (
              <motion.div
                key={link.id}
                layout
                className="h-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 36 },
                  opacity: { duration: 0.22, delay: Math.min(i, 12) * 0.03 },
                  y: { duration: 0.28, delay: Math.min(i, 12) * 0.03, ease: [0.2, 0.8, 0.2, 1] },
                }}
              >
                <LinkCard
                  link={link}
                  variant={scoped ? "link" : variant}
                  view={view}
                  selected={selected.has(link.id)}
                  onSelect={toggleSelect}
                  handlers={handlers}
                  scope={scope}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <EditLinkDialog link={editing} onClose={() => setEditing(null)} onSave={(id, patch) => updateLink(id, patch)} />
      <LinkDetailsDialog link={details} onClose={() => setDetails(null)} />
      <QrPreviewDialog link={qrView} onClose={() => setQrView(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        confirmLabel="Move to trash"
        title={deleting && deleting.length > 1 ? `Delete ${deleting.length} links?` : "Delete this link?"}
        message={
          deleting && deleting.length === 1 ? (
            <>
              <span className="font-semibold text-neutral-700">{displayTitle(deleting[0])}</span> will stop redirecting
              and move to Deleted Links, where you can restore it.
            </>
          ) : (
            "They will stop redirecting and move to Deleted Links, where you can restore them."
          )
        }
        onConfirm={async () => {
          if (!deleting) return;
          await Promise.all(deleting.map((l) => updateLink(l.id, { isDeleted: true })));
          setSelected(new Set());
        }}
      />
      <ConfirmDialog
        open={!!purging}
        onClose={() => setPurging(null)}
        danger
        confirmLabel="Delete forever"
        title={
          purging && purging.length > 1
            ? `Permanently delete ${purging.length} links?`
            : "Permanently delete this link?"
        }
        message={
          <>
            {purging && purging.length === 1 ? (
              <span className="font-semibold text-neutral-700">{displayTitle(purging[0])}</span>
            ) : (
              "These links"
            )}{" "}
            and {purging && purging.length === 1 ? "its" : "their"} QR code{purging && purging.length === 1 ? "" : "s"} will
            be removed permanently, and the short code becomes free again. This can&apos;t be undone.
          </>
        }
        onConfirm={async () => {
          if (!purging) return;
          await Promise.all(purging.map((l) => purgeLink(l.id)));
          setSelected(new Set());
        }}
      />
    </div>
  );
}
