"use client";

import { useState } from "react";
import { FiPlus, FiTag, FiX } from "react-icons/fi";
import { normalizeTag } from "./utils";

/** Chip-style tag field for forms (Enter / comma to add, Backspace to remove). */
export function TagInput({
  value,
  onChange,
  placeholder = "marketing, launch...",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const tag = normalizeTag(draft);
    if (tag && !value.includes(tag) && value.length < 20) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-neutral-200 rounded-lg bg-neutral-50 focus-within:bg-white focus-within:border-neutral-400 px-2.5 py-2 transition-colors">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-white border border-neutral-200 text-neutral-700 text-xs font-medium pl-2 pr-1 py-0.5"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="p-0.5 rounded text-neutral-400 hover:text-neutral-900"
            aria-label={`Remove ${tag}`}
          >
            <FiX size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? "" : placeholder}
        className="flex-1 min-w-[80px] bg-transparent py-0.5 text-sm outline-none placeholder:text-neutral-400"
      />
    </div>
  );
}

/** Tags row shown on a link card — click a tag to filter, × to remove, "+" to add inline. */
export function InlineTags({
  tags,
  onChange,
  onTagClick,
  compact,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  onTagClick?: (tag: string) => void;
  compact?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const visible = compact ? tags.slice(0, 2) : tags;
  const hidden = tags.length - visible.length;

  function commit() {
    const tag = normalizeTag(draft);
    if (tag && !tags.includes(tag) && tags.length < 20) onChange([...tags, tag]);
    setDraft("");
    setAdding(false);
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <FiTag size={13} className="text-neutral-500 shrink-0" />
      {tags.length === 0 && !adding && <span className="text-neutral-500">No tags</span>}
      {visible.map((tag) => (
        <span
          key={tag}
          className="group/tag inline-flex items-center gap-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-medium pl-1.5 pr-1 py-0.5"
        >
          <button
            type="button"
            onClick={() => onTagClick?.(tag)}
            className="hover:underline"
            title={`Filter by "${tag}"`}
          >
            {tag}
          </button>
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="opacity-0 group-hover/tag:opacity-100 focus:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-900 transition-opacity"
            aria-label={`Remove tag ${tag}`}
          >
            <FiX size={10} />
          </button>
        </span>
      ))}
      {hidden > 0 && <span className="text-[11px] font-medium text-neutral-400">+{hidden}</span>}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          onBlur={commit}
          placeholder="New tag"
          className="w-24 rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] font-medium outline-none focus:border-neutral-500"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-neutral-300 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 hover:border-neutral-500 hover:text-neutral-900 transition-colors"
          aria-label="Add tag"
        >
          <FiPlus size={10} />
          {tags.length === 0 && "Add"}
        </button>
      )}
    </span>
  );
}
