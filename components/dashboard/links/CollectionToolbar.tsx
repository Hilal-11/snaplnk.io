"use client";

import Link from "next/link";
import { FiList, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { BsGrid, BsGrid3X3Gap } from "react-icons/bs";
import type { ViewMode } from "./types";

const VIEWS: { key: ViewMode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "list", label: "One by one", icon: FiList },
  { key: "grid2", label: "2 column grid", icon: BsGrid },
  { key: "grid4", label: "4 column grid", icon: BsGrid3X3Gap },
];

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="w-full sm:max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 focus-within:border-neutral-400 transition-colors">
      <FiSearch size={15} className="text-neutral-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="text-neutral-400 hover:text-neutral-900">
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5" role="radiogroup" aria-label="Layout">
      {VIEWS.map((v) => (
        <span key={v.key} className="relative group/vt">
          <button
            role="radio"
            aria-checked={value === v.key}
            aria-label={v.label}
            onClick={() => onChange(v.key)}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              value === v.key ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            } ${v.key === "grid4" ? "hidden md:flex" : ""}`}
          >
            <v.icon size={15} />
          </button>
          <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover/vt:opacity-100 transition-opacity z-20">
            {v.label}
          </span>
        </span>
      ))}
    </div>
  );
}

export function CreateButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
    >
      <FiPlus size={15} />
      {label}
    </Link>
  );
}

export function PageTitle({ title, subtitle, count }: { title: string; subtitle: string; count?: number }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
        {title}
        {typeof count === "number" && (
          <span className="text-sm font-semibold text-neutral-500 bg-neutral-100 rounded-md px-2 py-0.5">{count}</span>
        )}
      </h1>
      <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
    </div>
  );
}
