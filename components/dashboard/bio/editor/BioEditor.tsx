"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiCloud,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiEyeOff,
  FiExternalLink,
  FiGlobe,
  FiLayers,
  FiDroplet,
  FiX,
} from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import BioRenderer from "@/components/bio/BioRenderer";
import { BIO_SCHEMA_VERSION, bioDocumentSchema, getPlaceholderBlocks, type Block } from "@/lib/bio/blocks";
import { themeSchema, type ThemeInput } from "@/lib/bio/theme";
import { getBaseUrl } from "@/lib/utils/getShortUrl";
import BlockList from "./BlockList";
import DesignPanel from "./DesignPanel";

export type EditorDoc = { displayName: string; bio: string; theme: ThemeInput; blocks: Block[] };

type SaveStatus = "saved" | "unsaved" | "saving" | "invalid" | "error" | "conflict";
type Issue = { message: string; blockId?: string };

const HISTORY_LIMIT = 50;
const SAVE_DELAY = 1200;

/** Client-side validation mirroring the server; returns field errors keyed by block id. */
function validateDoc(doc: EditorDoc): { ok: boolean; blockErrors: Record<string, string>; general: string[] } {
  const blockErrors: Record<string, string> = {};
  const general: string[] = [];
  const r = bioDocumentSchema.safeParse({ schema_version: BIO_SCHEMA_VERSION, blocks: doc.blocks });
  if (!r.success) {
    for (const issue of r.error.issues) {
      const [root, idx, field] = issue.path;
      if (root === "blocks" && typeof idx === "number") {
        const id = doc.blocks[idx]?.id;
        if (id && !blockErrors[id]) blockErrors[id] = `${field ? `${String(field)}: ` : ""}${issue.message}`;
      } else general.push(issue.message);
    }
  }
  const t = themeSchema.safeParse(doc.theme);
  if (!t.success) general.push(`Design: ${t.error.issues[0]?.message ?? "invalid colour"}`);
  if (doc.displayName.length > 60) general.push("Display name is too long (60 max)");
  if (doc.bio.length > 160) general.push("Bio is too long (160 max)");
  return { ok: Object.keys(blockErrors).length === 0 && general.length === 0, blockErrors, general };
}

export default function BioEditor({
  page,
}: {
  page: {
    id: string;
    username: string;
    version: number;
    isPublished: boolean;
    isSuspended: boolean;
    hasUnpublishedChanges: boolean;
    displayName: string;
    bio: string;
    theme: ThemeInput;
    blocks: Block[];
  };
}) {
  const [doc, setDoc] = useState<EditorDoc>({
    displayName: page.displayName,
    bio: page.bio,
    theme: page.theme,
    blocks: page.blocks,
  });
  const docRef = useRef(doc);
  const versionRef = useRef(page.version);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef<Promise<boolean> | null>(null);

  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errors, setErrors] = useState(() => validateDoc(doc));
  const [tab, setTab] = useState<"content" | "design">("content");
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [hasChanges, setHasChanges] = useState(page.hasUnpublishedChanges);
  const [publishing, setPublishing] = useState(false);
  const [publishIssues, setPublishIssues] = useState<{ errors: Issue[]; warnings: Issue[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");

  // ---------- undo / redo ----------
  const past = useRef<EditorDoc[]>([]);
  const future = useRef<EditorDoc[]>([]);
  const lastPush = useRef(0);
  const [history, setHistory] = useState({ past: 0, future: 0 });
  const syncHistory = () => setHistory({ past: past.current.length, future: future.current.length });

  const publicUrl = `${getBaseUrl()}/@${page.username}`;
  const publicHost = publicUrl.replace(/^https?:\/\//, "");

  // ---------- saving ----------
  const save = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (savingRef.current) await savingRef.current;

    const current = docRef.current;
    const v = validateDoc(current);
    setErrors(v);
    if (!v.ok) {
      setStatus("invalid");
      return false;
    }

    const run = (async () => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/bio/pages/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expected_version: versionRef.current,
            display_name: current.displayName,
            bio: current.bio,
            theme: current.theme,
            draft: { schema_version: BIO_SCHEMA_VERSION, blocks: current.blocks },
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setStatus("conflict");
          return false;
        }
        if (!res.ok) {
          setStatus("error");
          setToast(json.error ?? "Couldn't save");
          return false;
        }
        versionRef.current = json.data.version;
        // Only mark saved if nothing changed while the request was in flight.
        setStatus(docRef.current === current ? "saved" : "unsaved");
        return true;
      } catch {
        setStatus("error");
        return false;
      }
    })();
    savingRef.current = run;
    const ok = await run;
    savingRef.current = null;
    return ok;
  }, [page.id]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), SAVE_DELAY);
  }, [save]);

  /** Every edit goes through here: history, dirty state, validation, autosave. */
  const update = useCallback(
    (mutate: (d: EditorDoc) => EditorDoc, opts: { coalesce?: boolean } = {}) => {
      const prev = docRef.current;
      const next = mutate(prev);
      if (next === prev) return;
      const now = Date.now();
      if (!opts.coalesce || now - lastPush.current > 600) {
        past.current = [...past.current.slice(-(HISTORY_LIMIT - 1)), prev];
        future.current = [];
        syncHistory();
      }
      lastPush.current = now;
      docRef.current = next;
      setDoc(next);
      setErrors(validateDoc(next));
      setStatus("unsaved");
      setHasChanges(true);
      setPublishIssues(null);
      scheduleSave();
    },
    [scheduleSave]
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(docRef.current);
    docRef.current = prev;
    setDoc(prev);
    setErrors(validateDoc(prev));
    setStatus("unsaved");
    setHasChanges(true);
    syncHistory();
    scheduleSave();
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(docRef.current);
    docRef.current = next;
    setDoc(next);
    setErrors(validateDoc(next));
    setStatus("unsaved");
    setHasChanges(true);
    syncHistory();
    scheduleSave();
  }, [scheduleSave]);

  // Keyboard shortcuts: Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y, Ctrl/Cmd+S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      const inText =
        e.target instanceof HTMLElement && (e.target.tagName === "TEXTAREA" || (e.target.tagName === "INPUT" && (e.target as HTMLInputElement).type === "text"));
      if (key === "s") {
        e.preventDefault();
        void save();
      } else if (key === "z" && !inText) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y" && !inText) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, undo, redo]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (status === "unsaved" || status === "saving" || status === "invalid" || status === "error") {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  }

  // ---------- publish ----------
  async function publish() {
    setPublishing(true);
    setPublishIssues(null);
    try {
      const saved = status === "saved" ? true : await save();
      if (!saved) {
        const v = validateDoc(docRef.current);
        setPublishIssues({
          errors: [
            ...v.general.map((message) => ({ message })),
            ...Object.entries(v.blockErrors).map(([blockId, message]) => ({ blockId, message })),
            ...(v.ok ? [{ message: "Couldn't save your latest changes. Check your connection and try again." }] : []),
          ],
          warnings: [],
        });
        return;
      }
      const res = await fetch(`/api/bio/pages/${page.id}/publish`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 422) {
        setPublishIssues({ errors: json.errors ?? [], warnings: json.warnings ?? [] });
        setTab("content");
        return;
      }
      if (!res.ok) {
        showToast(json.error ?? "Couldn't publish");
        return;
      }
      setIsPublished(true);
      setHasChanges(false);
      if (json.warnings?.length) setPublishIssues({ errors: [], warnings: json.warnings });
      showToast("Published! Your page is live.");
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/bio/pages/${page.id}/unpublish`, { method: "POST" });
      if (res.ok) {
        setIsPublished(false);
        setHasChanges(true);
        showToast("Your page is offline.");
      } else showToast("Couldn't unpublish");
    } finally {
      setPublishing(false);
    }
  }

  const placeholderCount = getPlaceholderBlocks(doc.blocks).length;
  const flaggedIds = [
    ...Object.keys(errors.blockErrors),
    ...(publishIssues?.errors.map((e) => e.blockId).filter((x): x is string => !!x) ?? []),
  ];

  const statusLabel: Record<SaveStatus, { text: string; cls: string; icon: React.ReactNode }> = {
    saved: { text: "Saved", cls: "text-neutral-500", icon: <FiCheck /> },
    unsaved: { text: "Unsaved", cls: "text-neutral-500", icon: <FiCloud /> },
    saving: { text: "Saving...", cls: "text-neutral-500", icon: <Spinner className="size-3" /> },
    invalid: { text: "Fix errors to save", cls: "text-orange-700", icon: <FiAlertTriangle /> },
    error: { text: "Save failed", cls: "text-red-600", icon: <FiAlertTriangle /> },
    conflict: { text: "Edited in another tab", cls: "text-red-600", icon: <FiAlertTriangle /> },
  };
  const s = statusLabel[status];

  return (
    <div className="max-w-full">
      {/* ---------- top bar ---------- */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/bio-pages"
          aria-label="Back to bio pages"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900"
        >
          <FiArrowLeft />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-neutral-900">{doc.displayName || `@${page.username}`}</p>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              {publicHost} {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy size={11} />}
            </button>
            <span className={`flex items-center gap-1 ${s.cls}`} aria-live="polite">
              {s.icon} {s.text}
            </span>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5">
            <button
              onClick={undo}
              disabled={history.past === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
            >
              <FiCornerUpLeft />
            </button>
            <button
              onClick={redo}
              disabled={history.future === 0}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
            >
              <FiCornerUpRight />
            </button>
          </div>

          {isPublished ? (
            <>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                <FiExternalLink size={14} /> View
              </a>
              <button
                onClick={unpublish}
                disabled={publishing}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                <FiEyeOff size={14} /> Unpublish
              </button>
            </>
          ) : null}

          <button
            onClick={publish}
            disabled={publishing || page.isSuspended || (isPublished && !hasChanges && status === "saved")}
            className="flex items-center gap-1.5 rounded-lg btn-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {publishing ? <Spinner className="size-4" /> : <FiGlobe size={14} />}
            {isPublished ? (hasChanges ? "Publish changes" : "Published") : "Publish"}
            {placeholderCount > 0 && !publishing && (
              <span className="rounded bg-brand px-1.5 text-[10px] font-bold text-white" title="Sample links to replace">
                {placeholderCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {status === "conflict" && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertTriangle className="shrink-0" />
          <span>This page was changed in another tab. Reload to get the latest version (your unsaved edits here will be lost).</span>
          <button onClick={() => window.location.reload()} className="ml-auto rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
            Reload
          </button>
        </div>
      )}

      {/* publish issues */}
      <AnimatePresence>
        {publishIssues && (publishIssues.errors.length > 0 || publishIssues.warnings.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mb-4 rounded-xl border p-4 text-sm ${
              publishIssues.errors.length ? "border-orange-100 bg-orange-50" : "border-neutral-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-neutral-900">
                {publishIssues.errors.length
                  ? `Fix ${publishIssues.errors.length} thing${publishIssues.errors.length === 1 ? "" : "s"} before publishing`
                  : "Published with a few suggestions"}
              </p>
              <button onClick={() => setPublishIssues(null)} aria-label="Dismiss" className="text-neutral-400 hover:text-neutral-900">
                <FiX />
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {publishIssues.errors.map((e, i) => (
                <li key={`e${i}`} className="flex items-start gap-2 text-orange-800">
                  <FiAlertTriangle className="mt-0.5 shrink-0" /> {e.message}
                </li>
              ))}
              {publishIssues.warnings.map((w, i) => (
                <li key={`w${i}`} className="flex items-start gap-2 text-neutral-600">
                  <FiDroplet className="mt-0.5 shrink-0" /> {w.message}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile: edit / preview switch */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-neutral-200 bg-white p-1 lg:hidden">
        {(["edit", "preview"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setMobilePane(p)}
            className={`rounded-md py-1.5 text-sm font-semibold capitalize ${mobilePane === p ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6">
        {/* ---------- left: editor ---------- */}
        <div className={`${mobilePane === "preview" ? "hidden lg:block" : ""} min-w-0`}>
          <div className="mb-4 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 w-fit">
            {(
              [
                { key: "content", label: "Content", icon: FiLayers },
                { key: "design", label: "Design", icon: FiDroplet },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t.key ? "text-white" : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab === t.key && (
                  <motion.span layoutId="bio-editor-tab" className="absolute inset-0 rounded-md btn-primary" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <t.icon className="relative z-10" size={14} />
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>

          {errors.general.length > 0 && (
            <div className="mb-4 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              {errors.general.map((g) => (
                <p key={g}>{g}</p>
              ))}
            </div>
          )}

          {tab === "content" ? (
            <BlockList doc={doc} update={update} blockErrors={errors.blockErrors} issueBlockIds={flaggedIds} />
          ) : (
            <DesignPanel theme={doc.theme} onChange={(theme, coalesce) => update((d) => ({ ...d, theme }), { coalesce })} />
          )}
        </div>

        {/* ---------- right: live preview ---------- */}
        <aside className={`${mobilePane === "edit" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-24">
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wide">Live preview</span>
              {isPublished && !hasChanges ? (
                <span className="flex items-center gap-1 text-emerald-700">
                  <FiCheckCircle /> Live
                </span>
              ) : isPublished ? (
                <span className="text-orange-700">Unpublished changes</span>
              ) : (
                <span>Draft</span>
              )}
            </div>
            <div className="mx-auto w-fit rounded-[2.2rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-[0px_24px_48px_-16px_rgba(0,0,0,0.35)]">
              <div className="h-[640px] w-[332px] overflow-y-auto overflow-x-hidden rounded-[1.75rem] scrollbar-hide" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <div className="pointer-events-none min-h-full" style={{ width: 390, zoom: 332 / 390 }}>
                  <BioRenderer
                    mode="preview"
                    profile={{ displayName: doc.displayName, bio: doc.bio }}
                    theme={doc.theme}
                    blocks={doc.blocks}
                    username={page.username}
                    flaggedBlockIds={flaggedIds}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: "-50%", y: 16, scale: 0.98 }}
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-50%", y: 10 }}
            className="fixed bottom-6 left-1/2 z-[120] rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
