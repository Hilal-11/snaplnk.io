"use client";

import Link from "next/link";
import { FiList, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { BsGrid, BsGrid3X3Gap } from "react-icons/bs";
import { AnimatePresence, motion } from "motion/react";
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
    <div className="group w-full sm:max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 transition-[border-color,box-shadow] duration-200 hover:border-neutral-300 focus-within:border-brand/60 focus-within:shadow-[0_0_0_3px_var(--brand-soft)]">
      <FiSearch size={15} className="text-neutral-400 shrink-0 transition-colors duration-200 group-focus-within:text-brand" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="text-neutral-400 hover:text-neutral-900"
          >
            <FiX size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5" role="radiogroup" aria-label="Layout">
      {VIEWS.map((v) => {
        const active = value === v.key;
        return (
          <span key={v.key} className={`relative group/vt ${v.key === "grid4" ? "hidden md:block" : ""}`}>
            <button
              role="radio"
              aria-checked={active}
              aria-label={v.label}
              onClick={() => onChange(v.key)}
              className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors active:scale-90 ${
                active ? "text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="view-toggle-pill"
                  className="absolute inset-0 rounded-md btn-primary"
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                />
              )}
              <span className="relative z-10 transition-transform duration-200 group-hover/vt:scale-110">
                <v.icon size={15} />
              </span>
            </button>
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 translate-y-1 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover/vt:opacity-100 group-hover/vt:translate-y-0 transition-all duration-150 group-hover/vt:delay-300 z-20 shadow-lg">
              {v.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function CreateButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg btn-primary text-white text-sm font-medium"
    >
      <FiPlus size={15} className="transition-transform duration-300 group-hover:rotate-90" />
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
          <span className="text-xs font-semibold text-brand bg-brand-soft rounded-md px-2 py-0.5 tabular-nums">{count}</span>
        )}
      </h1>
      <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
    </div>
  );
}
