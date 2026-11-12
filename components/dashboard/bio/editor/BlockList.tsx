"use client";

import { useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import {
  FiAlignLeft,
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiChevronDown,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiLink,
  FiMinus,
  FiMoreVertical,
  FiPlay,
  FiPlus,
  FiShare2,
  FiTrash2,
  FiType,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  BLOCK_TYPE_LABELS,
  LINK_ICONS,
  SOCIAL_PLATFORMS,
  createDefaultBlock,
  type LinkIcon,
  type Block,
  type BlockOfType,
  type BlockType,
  type SocialPlatform,
} from "@/lib/bio/blocks";
import { SOCIAL_LABELS, SOCIAL_PLACEHOLDERS, socialUrl } from "@/lib/bio/socials";
import { parseEmbed } from "@/lib/bio/embeds";
import { BIO_PLANS } from "@/lib/bio/plans";
import type { EditorDoc } from "./BioEditor";

type Update = (mutate: (d: EditorDoc) => EditorDoc, opts?: { coalesce?: boolean }) => void;

const ICONS: Record<BlockType, React.ComponentType<{ size?: number; className?: string }>> = {
  link: FiLink,
  heading: FiType,
  text: FiAlignLeft,
  divider: FiMinus,
  social: FiShare2,
  embed: FiPlay,
  contact_card: FiUser,
};

const PALETTE: { type: BlockType; hint: string }[] = [
  { type: "link", hint: "Button to any URL" },
  { type: "heading", hint: "Section title" },
  { type: "text", hint: "A short paragraph" },
  { type: "social", hint: "Row of social icons" },
  { type: "embed", hint: "YouTube, Spotify..." },
  { type: "contact_card", hint: "Save-contact button" },
  { type: "divider", hint: "Line or space" },
];

export const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-400 focus:bg-white";

function summary(b: Block): string {
  switch (b.type) {
    case "link":
      return b.title;
    case "heading":
    case "text":
      return b.text;
    case "divider":
      return b.style;
    case "social": {
      const n = b.items.filter((i) => i.handle).length;
      return `${n}/${b.items.length} filled`;
    }
    case "embed":
      return b.url ? parseEmbed(b.url)?.provider ?? "Unsupported URL" : "Empty — paste a URL";
    case "contact_card":
      return b.title;
  }
}

export default function BlockList({
  doc,
  update,
  blockErrors,
  issueBlockIds,
}: {
  doc: EditorDoc;
  update: Update;
  blockErrors: Record<string, string>;
  issueBlockIds: string[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const maxBlocks = BIO_PLANS.free.maxBlocks;

  const setBlocks = (fn: (blocks: Block[]) => Block[], coalesce = false) =>
    update((d) => ({ ...d, blocks: fn(d.blocks) }), { coalesce });

  const patchBlock = (id: string, patch: Partial<Block>, coalesce = true) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)), coalesce);

  function move(id: string, dir: -1 | 1) {
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  function add(type: BlockType) {
    const block = createDefaultBlock(type);
    setBlocks((bs) => [...bs, block]);
    setOpen(block.id);
    setPaletteOpen(false);
  }

  function duplicate(id: string) {
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b.id === id);
      if (i < 0) return bs;
      const copy = [...bs];
      copy.splice(i + 1, 0, { ...structuredClone(bs[i]), id: crypto.randomUUID() });
      return copy;
    });
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-neutral-900">Profile</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Display name" count={`${doc.displayName.length}/60`}>
            <input
              value={doc.displayName}
              maxLength={60}
              onChange={(e) => update((d) => ({ ...d, displayName: e.target.value }), { coalesce: true })}
              placeholder="Your Name"
              className={inputCls}
            />
          </Field>
          <Field label="Bio" count={`${doc.bio.length}/160`}>
            <input
              value={doc.bio}
              maxLength={160}
              onChange={(e) => update((d) => ({ ...d, bio: e.target.value }), { coalesce: true })}
              placeholder="A short line about you"
              className={inputCls}
            />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">Avatar uses your initials. Photo upload is coming soon.</p>
      </section>

      {/* Blocks */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">
            Blocks <span className="font-normal text-neutral-400">{doc.blocks.length}/{maxBlocks}</span>
          </p>
          <p className="hidden sm:block text-[11px] text-neutral-400">Drag to reorder · or use the arrows</p>
        </div>

        <Reorder.Group
          as="ul"
          axis="y"
          values={doc.blocks}
          onReorder={(next: Block[]) => update((d) => ({ ...d, blocks: next }), { coalesce: true })}
          className="space-y-2"
        >
          <AnimatePresence initial={false}>
            {doc.blocks.map((b, i) => (
              <BlockRow
                key={b.id}
                block={b}
                index={i}
                total={doc.blocks.length}
                isOpen={open === b.id}
                error={blockErrors[b.id]}
                flagged={issueBlockIds.includes(b.id)}
                canDuplicate={doc.blocks.length < maxBlocks}
                onToggleOpen={() => setOpen(open === b.id ? null : b.id)}
                onMove={(dir) => move(b.id, dir)}
                onDuplicate={() => duplicate(b.id)}
                onRemove={() => setBlocks((bs) => bs.filter((x) => x.id !== b.id))}
                patch={(p, c) => patchBlock(b.id, p, c)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        {doc.blocks.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            No blocks yet. Add your first link below.
          </div>
        )}

        {/* palette */}
        <div className="mt-3">
          {paletteOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-neutral-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">Add a block</p>
                <button onClick={() => setPaletteOpen(false)} aria-label="Close" className="text-neutral-400 hover:text-neutral-900">
                  <FiX />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PALETTE.map((p) => {
                  const Icon = ICONS[p.type];
                  return (
                    <button
                      key={p.type}
                      onClick={() => add(p.type)}
                      disabled={doc.blocks.length >= maxBlocks}
                      className="group flex flex-col items-start gap-1.5 rounded-lg border border-neutral-200 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/50 disabled:opacity-40"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 group-hover:btn-primary">
                        <Icon size={14} />
                      </span>
                      <span className="text-xs font-semibold text-neutral-900">{BLOCK_TYPE_LABELS[p.type]}</span>
                      <span className="text-[11px] text-neutral-500">{p.hint}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setPaletteOpen(true)}
              disabled={doc.blocks.length >= maxBlocks}
              className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-600 transition-colors hover:border-brand/60 hover:text-neutral-900 disabled:opacity-50"
            >
              <FiPlus className="transition-transform group-hover:rotate-90" /> Add block
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-25 ${
        danger ? "text-neutral-400 hover:bg-red-50 hover:text-red-600" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, count, hint, children }: { label: string; count?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-semibold text-neutral-500">
        <span>
          {label} {hint && <span className="font-normal text-neutral-400">{hint}</span>}
        </span>
        {count && <span className="font-normal tabular-nums text-neutral-400">{count}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-medium text-neutral-700"
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand" : "bg-neutral-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

function Inspector({ block, patch }: { block: Block; patch: (p: Partial<Block>, coalesce?: boolean) => void }) {
  switch (block.type) {
    case "link":
      return <LinkInspector block={block} patch={patch} />;
    case "heading":
      return (
        <Field label="Heading" count={`${block.text.length}/80`}>
          <input value={block.text} maxLength={80} onChange={(e) => patch({ text: e.target.value })} className={inputCls} />
        </Field>
      );
    case "text":
      return (
        <Field label="Text" count={`${block.text.length}/500`} hint="**bold**  *italic*">
          <textarea
            value={block.text}
            maxLength={500}
            rows={4}
            onChange={(e) => patch({ text: e.target.value })}
            className={`${inputCls} resize-y`}
          />
        </Field>
      );
    case "divider":
      return (
        <div className="flex flex-wrap gap-2">
          {(["line", "dashed", "dots", "space"] as const).map((s) => (
            <button
              key={s}
              onClick={() => patch({ style: s }, false)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
                block.style === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      );
    case "social":
      return <SocialInspector block={block} patch={patch} />;
    case "embed": {
      const parsed = block.url ? parseEmbed(block.url) : null;
      return (
        <div className="space-y-2">
          <Field label="Video or music URL" hint="YouTube, Vimeo, Spotify, SoundCloud">
            <input
              value={block.url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputCls}
            />
          </Field>
          {block.url && (
            <p className={`text-xs ${parsed ? "text-emerald-700" : "text-orange-700"}`}>
              {parsed ? `✓ ${parsed.provider} embed detected` : "This URL isn't a supported embed — it won't be shown."}
            </p>
          )}
        </div>
      );
    }
    case "contact_card": {
      // Editing any detail confirms it is real, which clears the template placeholder flag.
      const set = (p: Partial<BlockOfType<"contact_card">>) => patch({ ...p, placeholder: undefined } as Partial<Block>);
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.placeholder && (
            <p className="sm:col-span-2 rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs font-medium text-brand">
              These are sample details. Edit them to be able to publish.
            </p>
          )}
          <Field label="Button text">
            <input value={block.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Name">
            <input value={block.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={block.phone} maxLength={32} onChange={(e) => set({ phone: e.target.value })} className={inputCls} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email">
            <input value={block.email} onChange={(e) => set({ email: e.target.value })} className={inputCls} placeholder="you@example.com" />
          </Field>
          <Field label="Company">
            <input value={block.company} maxLength={80} onChange={(e) => set({ company: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Website">
            <input value={block.website} onChange={(e) => set({ website: e.target.value })} className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Address">
            <input value={block.address ?? ""} maxLength={120} onChange={(e) => set({ address: e.target.value })} className={inputCls} placeholder="City, State" />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-neutral-400">
            Cover layout shows these as tap-to-call / email rows; other layouts show a “save contact” button. Hidden until a field is filled.
          </p>
        </div>
      );
    }
  }
}

function LinkInspector({ block, patch }: { block: BlockOfType<"link">; patch: (p: Partial<Block>, c?: boolean) => void }) {
  return (
    <div className="space-y-3">
      {block.placeholder && (
        <p className="rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs font-medium text-brand">
          This is a sample link. Paste your real URL to be able to publish.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" count={`${block.title.length}/80`}>
          <input value={block.title} maxLength={80} onChange={(e) => patch({ title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="URL">
          <input
            value={block.url}
            onChange={(e) => patch({ url: e.target.value, placeholder: undefined } as Partial<Block>)}
            placeholder="https://..."
            className={inputCls}
          />
        </Field>
        <Field label="Badge" hint="(optional)">
          <input
            value={block.badge ?? ""}
            maxLength={16}
            onChange={(e) => patch({ badge: e.target.value || undefined } as Partial<Block>)}
            placeholder="New"
            className={inputCls}
          />
        </Field>
        <div className="flex items-end pb-1.5">
          <Toggle checked={!!block.highlight} onChange={(v) => patch({ highlight: v || undefined } as Partial<Block>, false)} label="Highlight (gentle nudge)" />
        </div>
        <Field label="Icon" hint="(card layout)">
          <select
            value={block.icon ?? "auto"}
            onChange={(e) => patch({ icon: e.target.value === "auto" ? undefined : (e.target.value as LinkIcon) } as Partial<Block>, false)}
            className={inputCls}
          >
            {LINK_ICONS.map((i) => (
              <option key={i} value={i}>
                {i === "auto" ? "Auto (from URL)" : i.charAt(0).toUpperCase() + i.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function SocialInspector({ block, patch }: { block: BlockOfType<"social">; patch: (p: Partial<Block>, c?: boolean) => void }) {
  const setItems = (items: BlockOfType<"social">["items"], coalesce = true) => patch({ items } as Partial<Block>, coalesce);
  const used = new Set(block.items.map((i) => i.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  return (
    <div className="space-y-2">
      {block.items.map((item, i) => {
        const url = item.handle ? socialUrl(item.platform, item.handle) : null;
        return (
          <div key={item.platform} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-xs font-semibold text-neutral-600">{SOCIAL_LABELS[item.platform]}</span>
            <input
              value={item.handle}
              onChange={(e) => setItems(block.items.map((x, j) => (j === i ? { ...x, handle: e.target.value } : x)))}
              placeholder={SOCIAL_PLACEHOLDERS[item.platform]}
              className={`${inputCls} ${item.handle && !url ? "border-orange-300" : ""}`}
              aria-label={`${SOCIAL_LABELS[item.platform]} handle`}
            />
            <button
              type="button"
              onClick={() => setItems(block.items.filter((_, j) => j !== i), false)}
              aria-label={`Remove ${SOCIAL_LABELS[item.platform]}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
            >
              <FiX size={14} />
            </button>
          </div>
        );
      })}
      <p className="text-[11px] text-neutral-400">Empty or invalid handles aren&apos;t shown on your page.</p>
      {available.length > 0 && block.items.length < 12 && (
        <select
          value=""
          onChange={(e) => {
            const p = e.target.value as SocialPlatform;
            if (p) setItems([...block.items, { platform: p, handle: "" }], false);
          }}
          className={`${inputCls} w-auto`}
          aria-label="Add social platform"
        >
          <option value="">+ Add platform</option>
          {available.map((p) => (
            <option key={p} value={p}>
              {SOCIAL_LABELS[p]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function BlockRow({
  block: b,
  index: i,
  total,
  isOpen,
  error: err,
  flagged,
  canDuplicate,
  onToggleOpen,
  onMove,
  onDuplicate,
  onRemove,
  patch,
}: {
  block: Block;
  index: number;
  total: number;
  isOpen: boolean;
  error?: string;
  flagged: boolean;
  canDuplicate: boolean;
  onToggleOpen: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  patch: (p: Partial<Block>, coalesce?: boolean) => void;
}) {
  // Drag only from the handle, so typing/selecting inside the inspector never starts a drag.
  const controls = useDragControls();
  const Icon = ICONS[b.type];
  const placeholder = b.type === "link" && b.placeholder && !b.hidden;

  return (
    <Reorder.Item
      as="li"
      value={b}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileDrag={{ scale: 1.015, boxShadow: "0 16px 32px -12px rgba(0,0,0,0.3)", zIndex: 10 }}
      transition={{ duration: 0.18 }}
      className={`relative overflow-hidden rounded-xl border bg-white transition-colors ${
        flagged || err ? "border-orange-300" : isOpen ? "border-neutral-300" : "border-neutral-200"
      } ${b.hidden ? "bg-neutral-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Drag to reorder (or use the arrow buttons)"
          title="Drag to reorder"
          className="cursor-grab touch-none rounded-md p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600 active:cursor-grabbing"
        >
          <FiMoreVertical size={14} />
        </button>
        <button onClick={onToggleOpen} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              b.hidden ? "bg-neutral-100 text-neutral-400" : "btn-primary"
            }`}
          >
            <Icon size={14} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {BLOCK_TYPE_LABELS[b.type]}
              {b.hidden && <span className="normal-case tracking-normal">· hidden</span>}
              {placeholder && <span className="rounded bg-brand-soft px-1 normal-case tracking-normal text-brand">sample link</span>}
            </span>
            <span className={`block truncate text-sm font-medium ${b.hidden ? "text-neutral-400" : "text-neutral-900"}`}>
              {summary(b) || "—"}
            </span>
          </span>
          <FiChevronDown className={`ml-auto shrink-0 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <div className="flex shrink-0 items-center">
          <IconBtn label="Move up" onClick={() => onMove(-1)} disabled={i === 0}>
            <FiArrowUp size={13} />
          </IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(1)} disabled={i === total - 1}>
            <FiArrowDown size={13} />
          </IconBtn>
          <IconBtn label={b.hidden ? "Show" : "Hide"} onClick={() => patch({ hidden: !b.hidden }, false)}>
            {b.hidden ? <FiEye size={13} /> : <FiEyeOff size={13} />}
          </IconBtn>
          <IconBtn label="Duplicate" onClick={onDuplicate} disabled={!canDuplicate}>
            <FiCopy size={13} />
          </IconBtn>
          <IconBtn label="Delete (Ctrl+Z to undo)" danger onClick={onRemove}>
            <FiTrash2 size={13} />
          </IconBtn>
        </div>
      </div>

      {err && !isOpen && (
        <p className="flex items-center gap-1.5 border-t border-orange-100 bg-orange-50 px-3 py-1.5 text-xs text-orange-800">
          <FiAlertTriangle size={12} /> {err}
        </p>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-100 p-3.5">
              {err && (
                <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800">
                  <FiAlertTriangle size={12} /> {err}
                </p>
              )}
              <Inspector block={b} patch={patch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}
