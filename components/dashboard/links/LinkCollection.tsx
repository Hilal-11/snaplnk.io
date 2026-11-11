"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/components/ui/spinner";
import { FiAlertCircle, FiEyeOff, FiLink, FiTag, FiTrash2, FiX, FiEye } from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import LinkCard, { type LinkCardHandlers } from "./LinkCard";
import { ConfirmDialog, EditLinkDialog, LinkDetailsDialog, QrPreviewDialog } from "./LinkDialogs";
import { CreateButton, PageTitle, SearchInput, ViewToggle } from "./CollectionToolbar";
import { useLinks } from "./useLinks";
import type { CardVariant, LinkItem, ViewMode } from "./types";
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

const COPY: Record<CardVariant, { title: string; subtitle: string; create: string; href: string; search: string; noun: string }> = {
  link: {
    title: "Links",
    subtitle: "Manage, tag and track every short link you've created.",
    create: "Create Link",
    href: "/dashboard/links/new",
    search: "Search links, URLs or tags",
    noun: "link",
  },
  qr: {
    title: "QR Codes",
    subtitle: "Every QR code points to a trackable short link — download, share and measure scans.",
    create: "Create QR Code",
    href: "/dashboard/qr-codes/new",
    search: "Search QR codes",
    noun: "QR code",
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

export default function LinkCollection({ variant }: { variant: CardVariant }) {
  const copy = COPY[variant];
  const viewKey = `snaplnk:view:${variant}`;
  const { links: allLinks, loading, error, updateLink } = useLinks();

  const [viewOverride, setViewOverride] = useState<ViewMode | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [details, setDetails] = useState<LinkItem | null>(null);
  const [qrView, setQrView] = useState<LinkItem | null>(null);
  const [deleting, setDeleting] = useState<LinkItem[] | null>(null);

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

  const links = useMemo(
    () => (variant === "qr" ? allLinks.filter((l) => l.qr_code_url) : allLinks),
    [allLinks, variant]
  );

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
      const s = getLinkStatus(l);
      if (filter === "all" && s === "hidden") return false;
      if (filter === "expired" && s !== "expired" && s !== "limit") return false;
      if (filter !== "all" && filter !== "expired" && s !== filter) return false;
      if (tagFilter && !(l.tags ?? []).includes(tagFilter)) return false;
      if (!q) return true;
      return (
        l.short_code.toLowerCase().includes(q) ||
        l.original_url.toLowerCase().includes(q) ||
        (l.title ?? "").toLowerCase().includes(q) ||
        (l.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
    out.sort((a, b) => {
      if (sort === "clicks") return b.clicks_count - a.clicks_count;
      const d = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === "newest" ? d : -d;
    });
    return out;
  }, [links, search, filter, sort, tagFilter]);

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

  async function bulkToggleHidden() {
    await Promise.all(
      selectedLinks.map((l) => updateLink(l.id, { archivedLink: bulkHide }, { archived_link: bulkHide }))
    );
    setSelected(new Set());
  }

  const Empty = variant === "qr" ? TbQrcode : FiLink;
  const filtered = search || tagFilter || filter !== "all";

  return (
    <div className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageTitle title={copy.title} subtitle={copy.subtitle} count={loading ? undefined : links.length} />
        <CreateButton href={copy.href} label={copy.create} />
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
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="clicks">Most clicks</option>
          </select>
          <ViewToggle value={view} onChange={changeView} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {f.label}
            {!loading && (
              <span className={filter === f.key ? "text-neutral-300" : "text-neutral-400"}>{counts[f.key]}</span>
            )}
          </button>
        ))}
        {tagFilter && (
          <span className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
            <FiTag size={12} /> {tagFilter}
            <button onClick={() => setTagFilter(null)} aria-label="Clear tag filter" className="p-0.5 rounded hover:bg-blue-100">
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
              className="w-4 h-4 rounded accent-neutral-900"
            />
            Select all
          </label>
        )}
      </div>

      {/* Bulk bar */}
      {selectedLinks.length > 0 && (
        <div className="sticky top-2 lg:top-20 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-neutral-900 text-white px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-semibold mr-2">{selectedLinks.length} selected</span>
          <button
            onClick={bulkToggleHidden}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-white/10"
          >
            {bulkHide ? <FiEyeOff size={13} /> : <FiEye size={13} />} {bulkHide ? "Hide" : "Unhide"}
          </button>
          <button
            onClick={() => setDeleting(selectedLinks)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-300 hover:bg-white/10"
          >
            <FiTrash2 size={13} /> Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto p-1.5 rounded-md hover:bg-white/10"
            aria-label="Clear selection"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-full border border-neutral-200/70 bg-white px-8 py-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_4px_12px_rgba(0,0,0,0.05)]">
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
        <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <Empty size={24} className="text-white" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {filtered ? `No ${copy.noun}s match` : `No ${copy.noun}s yet`}
          </h3>
          <p className="text-sm text-neutral-500 mb-5">
            {filtered ? "Try a different search, filter or tag." : `Create your first ${copy.noun} to get started.`}
          </p>
          {!filtered && (
            <div className="flex justify-center">
              <CreateButton href={copy.href} label={copy.create} />
            </div>
          )}
        </div>
      ) : (
        <div className={GRID_CLASS[view]}>
          {visible.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              variant={variant}
              view={view}
              selected={selected.has(link.id)}
              onSelect={toggleSelect}
              handlers={handlers}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EditLinkDialog link={editing} onClose={() => setEditing(null)} onSave={(id, patch) => updateLink(id, patch)} />
      <LinkDetailsDialog link={details} onClose={() => setDetails(null)} />
      <QrPreviewDialog link={qrView} onClose={() => setQrView(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        confirmLabel="Delete"
        title={deleting && deleting.length > 1 ? `Delete ${deleting.length} ${copy.noun}s?` : `Delete this ${copy.noun}?`}
        message={
          deleting && deleting.length === 1 ? (
            <>
              <span className="font-semibold text-neutral-700">{displayTitle(deleting[0])}</span> will stop redirecting
              and move to Deleted Links.
            </>
          ) : (
            "They will stop redirecting and move to Deleted Links."
          )
        }
        onConfirm={async () => {
          if (!deleting) return;
          await Promise.all(deleting.map((l) => updateLink(l.id, { isDeleted: true })));
          setSelected(new Set());
        }}
      />
    </div>
  );
}
