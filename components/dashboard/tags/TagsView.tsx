"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiBarChart2,
  FiCheck,
  FiEdit2,
  FiHash,
  FiLink,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import { PageTitle, SearchInput, ViewToggle } from "@/components/dashboard/links/CollectionToolbar";
import Modal, { PrimaryButton, SecondaryButton } from "@/components/dashboard/links/Modal";
import { ConfirmDialog } from "@/components/dashboard/links/LinkDialogs";
import { useLinks } from "@/components/dashboard/links/useLinks";
import type { LinkItem, ViewMode } from "@/components/dashboard/links/types";
import { displayTitle, normalizeTag, timeAgo } from "@/components/dashboard/links/utils";
import { getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { getDefaultView, subscribeDevicePrefs } from "@/lib/devicePrefs";

type Sort = "links" | "clicks" | "name" | "recent";
type TagGroup = { name: string; links: LinkItem[]; clicks: number; lastUsed: string };

const MAX_TAGS_PER_LINK = 20;
const GRID_CLASS: Record<ViewMode, string> = {
  list: "grid grid-cols-1 gap-3",
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  grid4: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4",
};

function readView(): ViewMode {
  try {
    const v = localStorage.getItem("snaplnk:view:tags");
    if (v === "list" || v === "grid2" || v === "grid4") return v;
  } catch {}
  return getDefaultView();
}

export default function TagsView() {
  const { links, loading, error, updateLink } = useLinks();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("links");
  const [viewOverride, setViewOverride] = useState<ViewMode | null>(null);
  const storedView = useSyncExternalStore(subscribeDevicePrefs, readView, () => "grid2" as ViewMode);
  const view = viewOverride ?? storedView;

  const [renaming, setRenaming] = useState<TagGroup | null>(null);
  const [removing, setRemoving] = useState<TagGroup | null>(null);
  const [assign, setAssign] = useState<{ tag: string; locked: boolean } | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, TagGroup>();
    for (const l of links) {
      for (const t of l.tags ?? []) {
        const g = map.get(t) ?? { name: t, links: [], clicks: 0, lastUsed: l.created_at };
        g.links.push(l);
        g.clicks += l.clicks_count;
        if (l.created_at > g.lastUsed) g.lastUsed = l.created_at;
        map.set(t, g);
      }
    }
    return [...map.values()];
  }, [links]);

  const stats = useMemo(() => {
    const tagged = links.filter((l) => (l.tags ?? []).length > 0);
    return {
      tags: groups.length,
      tagged: tagged.length,
      untagged: links.length - tagged.length,
      clicks: tagged.reduce((n, l) => n + l.clicks_count, 0),
    };
  }, [links, groups]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
    out.sort((a, b) => {
      if (sort === "clicks") return b.clicks - a.clicks;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recent") return b.lastUsed.localeCompare(a.lastUsed);
      return b.links.length - a.links.length || a.name.localeCompare(b.name);
    });
    return out;
  }, [groups, search, sort]);

  /** Rewrites tags on every affected link through the API (optimistic, rolls back per link). */
  async function rewriteTags(targets: LinkItem[], fn: (tags: string[]) => string[]) {
    await Promise.all(
      targets.map((l) => {
        const next = Array.from(new Set(fn(l.tags ?? []))).slice(0, MAX_TAGS_PER_LINK);
        return updateLink(l.id, { tags: next }, { tags: next });
      })
    );
  }

  function changeView(v: ViewMode) {
    setViewOverride(v);
    try {
      localStorage.setItem("snaplnk:view:tags", v);
    } catch {}
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageTitle
          title="Tags"
          subtitle="Group links by campaign, channel or client — then filter, rename or merge them in one place."
          count={loading ? undefined : groups.length}
        />
        <button
          onClick={() => setAssign({ tag: "", locked: false })}
          className="group flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg btn-primary text-white text-sm font-medium"
        >
          <FiPlus size={15} className="transition-transform duration-300 group-hover:rotate-90" />
          New tag
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tags", value: stats.tags, icon: FiTag },
          { label: "Tagged links", value: stats.tagged, icon: FiLink },
          { label: "Untagged links", value: stats.untagged, icon: FiHash, action: stats.untagged > 0 },
          { label: "Clicks on tagged links", value: stats.clicks, icon: FiBarChart2 },
        ].map((s) => (
          <div key={s.label} className="group hover-lift rounded-xl border border-neutral-200/80 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                <s.icon size={14} />
              </span>
              {s.action && (
                <button
                  onClick={() => setAssign({ tag: "", locked: false })}
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  Tag them
                </button>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {loading ? "—" : s.value.toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search tags" />
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort"
            className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm font-medium text-neutral-700 outline-none focus:border-neutral-400"
          >
            <option value="links">Most links</option>
            <option value="clicks">Most clicks</option>
            <option value="recent">Recently used</option>
            <option value="name">A–Z</option>
          </select>
          <ViewToggle value={view} onChange={changeView} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200/70 bg-white px-8 py-3">
            <Spinner className="size-5 text-neutral-500" />
            <p className="text-sm font-medium text-neutral-600">Loading your tags...</p>
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
            <FiTag size={24} className="text-white" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {search ? "No tags match" : "No tags yet"}
          </h3>
          <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto">
            {search
              ? "Try a different search."
              : "Create a tag and add links to it, or add tags right on any link card."}
          </p>
          {!search && links.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setAssign({ tag: "", locked: false })}
                className="flex items-center gap-1.5 rounded-lg btn-primary px-3.5 py-2 text-sm font-medium text-white"
              >
                <FiPlus size={14} /> Create a tag
              </button>
            </div>
          )}
        </div>
      ) : (
        <motion.div layout className={GRID_CLASS[view]}>
          <AnimatePresence initial mode="popLayout">
            {visible.map((g, i) => (
              <motion.div
                key={g.name}
                layout
                className="h-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 36 },
                  opacity: { duration: 0.22, delay: Math.min(i, 12) * 0.03 },
                  y: { duration: 0.28, delay: Math.min(i, 12) * 0.03 },
                }}
              >
                <TagCard
                  group={g}
                  compact={view === "grid4"}
                  row={view === "list"}
                  onRename={() => setRenaming(g)}
                  onRemove={() => setRemoving(g)}
                  onAddLinks={() => setAssign({ tag: g.name, locked: true })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <RenameTagDialog
        group={renaming}
        existing={groups.map((g) => g.name)}
        onClose={() => setRenaming(null)}
        onRename={async (from, to) => {
          const g = groups.find((x) => x.name === from);
          if (g) await rewriteTags(g.links, (tags) => tags.map((t) => (t === from ? to : t)));
        }}
      />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        danger
        confirmLabel="Remove tag"
        title={`Remove "${removing?.name ?? ""}"?`}
        message={
          <>
            The tag is removed from {removing?.links.length ?? 0} link{removing?.links.length === 1 ? "" : "s"}. The links
            themselves stay exactly as they are.
          </>
        }
        onConfirm={async () => {
          if (!removing) return;
          const name = removing.name;
          await rewriteTags(removing.links, (tags) => tags.filter((t) => t !== name));
        }}
      />

      <AssignTagDialog
        state={assign}
        links={links}
        existing={groups.map((g) => g.name)}
        onClose={() => setAssign(null)}
        onApply={async (tag, ids) => {
          const targets = links.filter((l) => ids.has(l.id) && !(l.tags ?? []).includes(tag));
          await rewriteTags(targets, (tags) => [...tags, tag]);
        }}
      />
    </div>
  );
}

/* ---------------- Tag card ---------------- */

function TagCard({
  group,
  compact,
  row,
  onRename,
  onRemove,
  onAddLinks,
}: {
  group: TagGroup;
  compact: boolean;
  row: boolean;
  onRename: () => void;
  onRemove: () => void;
  onAddLinks: () => void;
}) {
  const top = [...group.links].sort((a, b) => b.clicks_count - a.clicks_count).slice(0, compact ? 2 : 3);
  const href = `/dashboard/links?tag=${encodeURIComponent(group.name)}`;

  const actions = (
    <div className="flex items-center gap-0.5 shrink-0">
      <IconBtn label="Add links" onClick={onAddLinks}>
        <FiPlus size={15} />
      </IconBtn>
      <IconBtn label="Rename / merge" onClick={onRename}>
        <FiEdit2 size={14} />
      </IconBtn>
      <IconBtn label="Remove tag" onClick={onRemove} danger>
        <FiTrash2 size={14} />
      </IconBtn>
      <Link
        href={href}
        aria-label={`View links tagged ${group.name}`}
        title="View links"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-[background-color,color,transform] hover:-translate-y-px hover:bg-neutral-100 hover:text-brand active:scale-90"
      >
        <FiArrowUpRight size={16} />
      </Link>
    </div>
  );

  const header = (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg btn-primary">
        <FiHash size={16} />
      </span>
      <div className="min-w-0">
        <Link
          href={href}
          className="block truncate text-[16px] font-bold text-neutral-900 hover:underline decoration-brand decoration-2 underline-offset-4"
        >
          {group.name}
        </Link>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-neutral-500">
          <span>
            {group.links.length} link{group.links.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiBarChart2 size={11} /> {group.clicks.toLocaleString()} clicks
          </span>
          {!compact && <span>Last used {timeAgo(group.lastUsed)}</span>}
        </p>
      </div>
    </div>
  );

  const linkList = (
    <ul className="space-y-1">
      {top.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs">
          <span className="min-w-0 truncate font-medium text-neutral-700" title={l.original_url}>
            {displayTitle(l)}
            <span className="ml-1.5 font-normal text-neutral-400">{getShortUrlDisplay(l.short_code).split("/").pop()}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-neutral-500">
            <FiBarChart2 size={10} /> {l.clicks_count}
          </span>
        </li>
      ))}
      {group.links.length > top.length && (
        <li>
          <Link href={href} className="block pt-0.5 text-center text-[11px] font-semibold text-neutral-500 hover:text-brand">
            +{group.links.length - top.length} more
          </Link>
        </li>
      )}
    </ul>
  );

  const base =
    "group h-full rounded-xl border border-neutral-200/80 bg-white transition-all hover:border-neutral-300 hover:shadow-[0px_10px_28px_-14px_rgba(0,0,0,0.22)]";

  if (row) {
    return (
      <div className={`${base} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}>
        <div className="sm:w-72 shrink-0">{header}</div>
        <div className="hidden min-w-0 flex-1 md:flex flex-wrap gap-1.5">
          {top.map((l) => (
            <span key={l.id} className="max-w-[220px] truncate rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
              {displayTitle(l)}
            </span>
          ))}
        </div>
        <div className="sm:ml-auto">{actions}</div>
      </div>
    );
  }

  return (
    <div className={`${base} flex flex-col ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-2">
        {header}
        {!compact && actions}
      </div>
      <div className="mt-4">{linkList}</div>
      {compact && <div className="mt-auto flex justify-end border-t border-neutral-100 pt-2">{actions}</div>}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-[background-color,color,transform] hover:-translate-y-px active:scale-90 ${
        danger ? "text-neutral-500 hover:bg-red-50 hover:text-red-600" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- Rename / merge ---------------- */

function RenameTagDialog({
  group,
  existing,
  onClose,
  onRename,
}: {
  group: TagGroup | null;
  existing: string[];
  onClose: () => void;
  onRename: (from: string, to: string) => Promise<void>;
}) {
  return (
    <Modal open={!!group} onClose={onClose} size="sm" title="Rename tag" description={group ? `Used on ${group.links.length} link${group.links.length === 1 ? "" : "s"}` : undefined}>
      {group && <RenameForm key={group.name} group={group} existing={existing} onClose={onClose} onRename={onRename} />}
    </Modal>
  );
}

function RenameForm({
  group,
  existing,
  onClose,
  onRename,
}: {
  group: TagGroup;
  existing: string[];
  onClose: () => void;
  onRename: (from: string, to: string) => Promise<void>;
}) {
  const [value, setValue] = useState(group.name);
  const [busy, setBusy] = useState(false);
  const next = normalizeTag(value);
  const merging = next !== group.name && existing.includes(next);
  const unchanged = !next || next === group.name;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (unchanged) return;
        setBusy(true);
        await onRename(group.name, next);
        setBusy(false);
        onClose();
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-500">New name</span>
        <input
          autoFocus
          value={value}
          maxLength={40}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:bg-white"
        />
      </label>
      {merging && (
        <p className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          &ldquo;{next}&rdquo; already exists — its links and these will be merged into one tag.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose} disabled={busy}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={busy || unchanged}>
          {busy && <Spinner className="size-4" />}
          {merging ? "Merge tags" : "Rename"}
        </PrimaryButton>
      </div>
    </form>
  );
}

/* ---------------- New tag / add links ---------------- */

function AssignTagDialog({
  state,
  links,
  existing,
  onClose,
  onApply,
}: {
  state: { tag: string; locked: boolean } | null;
  links: LinkItem[];
  existing: string[];
  onClose: () => void;
  onApply: (tag: string, ids: Set<string>) => Promise<void>;
}) {
  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="lg"
      title={state?.locked ? `Add links to "${state.tag}"` : "New tag"}
      description="Pick the links this tag should be on."
    >
      {state && <AssignForm key={`${state.tag}-${state.locked}`} state={state} links={links} existing={existing} onClose={onClose} onApply={onApply} />}
    </Modal>
  );
}

function AssignForm({
  state,
  links,
  existing,
  onClose,
  onApply,
}: {
  state: { tag: string; locked: boolean };
  links: LinkItem[];
  existing: string[];
  onClose: () => void;
  onApply: (tag: string, ids: Set<string>) => Promise<void>;
}) {
  const [name, setName] = useState(state.tag);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const tag = normalizeTag(name);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const q = query.trim().toLowerCase();
  const shown = links.filter(
    (l) =>
      !q ||
      displayTitle(l).toLowerCase().includes(q) ||
      l.short_code.toLowerCase().includes(q) ||
      l.original_url.toLowerCase().includes(q)
  );
  const has = (l: LinkItem) => !!tag && (l.tags ?? []).includes(tag);
  const full = (l: LinkItem) => (l.tags ?? []).length >= MAX_TAGS_PER_LINK && !has(l);
  const selectable = shown.filter((l) => !has(l) && !full(l));
  const allPicked = selectable.length > 0 && selectable.every((l) => picked.has(l.id));

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const count = [...picked].filter((id) => {
    const l = links.find((x) => x.id === id);
    return l && !has(l);
  }).length;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!tag || count === 0) return;
        setBusy(true);
        await onApply(tag, picked);
        setBusy(false);
        onClose();
      }}
      className="space-y-4"
    >
      {!state.locked && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Tag name</span>
          <input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. summer-campaign"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:bg-white"
          />
          {tag && existing.includes(tag) && (
            <span className="mt-1 block text-[11px] text-neutral-500">This tag exists — selected links will be added to it.</span>
          )}
        </label>
      )}

      <div className="rounded-xl border border-neutral-200">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
          <FiSearch size={14} className="text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            aria-label="Search links"
          />
          <button
            type="button"
            onClick={() =>
              setPicked((prev) => {
                const next = new Set(prev);
                selectable.forEach((l) => (allPicked ? next.delete(l.id) : next.add(l.id)));
                return next;
              })
            }
            disabled={selectable.length === 0}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 disabled:opacity-40"
          >
            {allPicked ? "Clear" : "Select all"}
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No links found.</li>}
          {shown.map((l) => {
            const already = has(l);
            const blocked = full(l);
            const checked = already || picked.has(l.id);
            return (
              <li key={l.id}>
                <label
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    already || blocked ? "opacity-60" : "cursor-pointer hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={already || blocked}
                    onChange={() => toggle(l.id)}
                    className="h-4 w-4 rounded-md accent-[var(--brand)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-neutral-900">{displayTitle(l)}</span>
                    <span className="block truncate text-xs text-neutral-500">{getShortUrlDisplay(l.short_code)}</span>
                  </span>
                  {already && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <FiCheck size={11} /> Tagged
                    </span>
                  )}
                  {blocked && <span className="text-[11px] text-neutral-400">20 tags max</span>}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {count > 0 ? `${count} link${count === 1 ? "" : "s"} will be tagged` : "Select at least one link"}
        </p>
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={busy || !tag || count === 0}>
            {busy && <Spinner className="size-4" />}
            {state.locked ? "Add links" : "Create tag"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
