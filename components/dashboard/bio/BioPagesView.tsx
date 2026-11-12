"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import { PageTitle, SearchInput } from "@/components/dashboard/links/CollectionToolbar";
import { ConfirmDialog } from "@/components/dashboard/links/LinkDialogs";
import { TEMPLATES, type BioTemplate } from "@/lib/bio/templates";
import { DEFAULT_THEME, parseThemeOrDefault } from "@/lib/bio/theme";
import { parseDocumentLenient } from "@/lib/bio/blocks";
import { getBaseUrl } from "@/lib/utils/getShortUrl";
import { formatDate } from "@/components/dashboard/links/utils";
import BioPreviewFrame from "./BioPreviewFrame";

type PageRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  theme: unknown;
  draft: unknown;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
  has_unpublished_changes: boolean;
};

const BLANK: BioTemplate = {
  id: "blank",
  name: "Blank",
  category: "start fresh",
  description: "Start from scratch and build your own — begins with a clean light card layout.",
  profile: { displayName: "Your Name", bio: "" },
  theme: DEFAULT_THEME,
  blocks: [],
};

export default function BioPagesView() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<PageRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bio/pages")
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? "Failed to load bio pages");
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setPages(json.data ?? []);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const q = search.trim().toLowerCase();
  const templates = useMemo(
    () =>
      [BLANK, ...TEMPLATES].filter(
        (t) => !q || [t.name, t.category, t.description].some((s) => s.toLowerCase().includes(q))
      ),
    [q]
  );
  const visiblePages = pages.filter(
    (p) => !q || p.username.includes(q) || p.display_name.toLowerCase().includes(q)
  );

  return (
    <div className="max-w-full mx-auto">
      <PageTitle
        title="Bio Pages"
        subtitle="One link in your bio for all your links, socials and content."
        count={loading ? undefined : pages.length}
      />

      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search pages and templates" />
      </div>

      {/* ---------- Your pages ---------- */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Your pages
          {!loading && (
            <span className="text-xs font-medium text-neutral-400">
              {pages.length} page{pages.length === 1 ? "" : "s"} · unlimited & free
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-5 py-4 w-fit">
            <Spinner className="size-4 text-neutral-500" />
            <span className="text-sm text-neutral-600">Loading your pages...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="mt-1 text-red-600/80">
                If this is a fresh setup, apply the bio_pages migrations in supabase/migrations to your database.
              </p>
            </div>
          </div>
        ) : visiblePages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
            {pages.length === 0
              ? "You don't have a bio page yet — pick a template below to create one."
              : "No pages match your search."}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visiblePages.map((p) => (
              <PageCard key={p.id} page={p} onDelete={() => setDeleting(p)} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Templates ---------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Start from a template
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Every template is free and you can create as many pages as you like. Change everything after.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white hover-lift hover:border-neutral-300 hover:shadow-[0px_12px_28px_-14px_rgba(0,0,0,0.25)]"
            >
              <div className="relative flex justify-center overflow-hidden border-b border-neutral-100 bg-neutral-50 pt-5">
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid mask-fade-radial" />
                <div className="relative overflow-hidden rounded-t-xl border border-b-0 border-neutral-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:-translate-y-1">
                  <BioPreviewFrame
                    width={210}
                    aspect={1.3}
                    username="yourname"
                    profile={t.profile}
                    theme={t.theme}
                    blocks={t.blocks.map((b, j) => ({ ...b, id: `00000000-0000-4000-8000-${String(j).padStart(12, "0")}` }))}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {t.category}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t.description}</p>
                <div className="mt-auto pt-4">
                  <Link
                    href={`/dashboard/bio-pages/new?template=${t.id}`}
                    className="group/btn flex w-full items-center justify-center gap-1.5 rounded-lg btn-primary py-2 text-sm font-semibold text-white"
                  >
                    {t.id === "blank" ? <FiPlus size={14} /> : null}
                    {t.id === "blank" ? "Start blank" : "Use this template"}
                    <FiArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        confirmLabel="Delete page"
        title={`Delete @${deleting?.username ?? ""}?`}
        message="The page goes offline immediately and its analytics are removed. This can't be undone."
        onConfirm={async () => {
          if (!deleting) return;
          const res = await fetch(`/api/bio/pages/${deleting.id}`, { method: "DELETE" });
          if (res.ok) setPages((prev) => prev.filter((p) => p.id !== deleting.id));
        }}
      />
    </div>
  );
}

function PageCard({ page, onDelete }: { page: PageRow; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `${getBaseUrl()}/@${page.username}`;
  const theme = parseThemeOrDefault(page.theme);
  const doc = parseDocumentLenient(page.draft);

  const status = !page.is_published
    ? { label: "Draft", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" }
    : page.has_unpublished_changes
      ? { label: "Unpublished changes", cls: "bg-orange-50 text-orange-700 border-orange-100" }
      : { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };

  return (
    <div className="group flex h-full items-stretch gap-4 rounded-xl border border-neutral-200 bg-white p-3 hover:border-neutral-300 hover:shadow-[0px_12px_28px_-16px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow]">
      <div className="shrink-0 self-stretch overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
        <BioPreviewFrame
          width={124}
          aspect={1.6}
          profile={{ displayName: page.display_name, bio: page.bio }}
          theme={theme}
          blocks={doc.blocks}
          username={page.username}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-neutral-900">{page.display_name || `@${page.username}`}</p>
            <p className="truncate text-sm font-semibold text-blue-600">{url.replace(/^https?:\/\//, "")}</p>
          </div>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
            {status.label}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
          <FiFileText size={12} /> {doc.blocks.length} block{doc.blocks.length === 1 ? "" : "s"} · edited{" "}
          {formatDate(page.updated_at)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          <Link
            href={`/dashboard/bio-pages/${page.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg btn-primary px-3 py-1.5 text-xs font-semibold text-white"
          >
            <FiEdit2 size={12} /> Edit
          </Link>
          {page.is_published && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <FiExternalLink size={12} /> View
            </a>
          )}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {copied ? <FiCheck size={12} className="text-orange-600" /> : <FiCopy size={12} />} {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete page"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
