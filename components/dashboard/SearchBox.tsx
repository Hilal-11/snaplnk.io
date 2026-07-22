// components/dashboard/CommandPalette.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiCalendar,
  FiGrid,
  FiLayers,
  FiHome,
  FiLink,
  FiBarChart2,
  FiArchive,
  FiClock,
  FiTrash2,
  FiTag,
  FiGlobe,
  FiUsers,
  FiKey,
  FiCreditCard,
  FiSettings,
  FiUser,
  FiMoon,
  FiCornerDownLeft,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";

type Item = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Popular" | "Pages" | "Settings";
  shortcut?: string;
};

const items: Item[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: FiHome, group: "Popular", shortcut: "D" },
  { id: "links", label: "My Links", href: "/dashboard/links", icon: FiLink, group: "Popular", shortcut: "L" },
  { id: "create", label: "Create Link", href: "/dashboard/links/new", icon: FiLayers, group: "Popular", shortcut: "C" },
  { id: "qr", label: "QR Codes", href: "/dashboard/qr-codes", icon: TbQrcode, group: "Popular" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: FiBarChart2, group: "Pages" },
  { id: "bio-pages", label: "Bio Pages", href: "/dashboard/bio-pages", icon: FiUser, group: "Pages" },
  { id: "archived", label: "Archived Links", href: "/dashboard/archived", icon: FiArchive, group: "Pages" },
  { id: "expired", label: "Expired Links", href: "/dashboard/expired", icon: FiClock, group: "Pages" },
  { id: "deleted", label: "Deleted Links", href: "/dashboard/deleted", icon: FiTrash2, group: "Pages" },
  { id: "tags", label: "Tags", href: "/dashboard/tags", icon: FiTag, group: "Pages" },
  { id: "domains", label: "Domains", href: "/dashboard/domains", icon: FiGlobe, group: "Pages" },
  { id: "team", label: "Team", href: "/dashboard/team", icon: FiUsers, group: "Settings" },
  { id: "api-keys", label: "API Keys", href: "/dashboard/api-keys", icon: FiKey, group: "Settings" },
  { id: "billing", label: "Billing", href: "/dashboard/billing", icon: FiCreditCard, group: "Settings" },
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: FiSettings, group: "Settings" },
  { id: "theme", label: "Change Theme", href: "#", icon: FiMoon, group: "Settings" },
];

const filters = [
  { key: "all", label: "All", icon: FiGrid },
  { key: "Popular", label: "Popular", icon: FiCalendar },
  { key: "Pages", label: "Pages", icon: FiLayers },
  { key: "Settings", label: "Settings", icon: FiSettings },
] as const;

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    let list = items;
    if (activeFilter !== "all") list = list.filter((i) => i.group === activeFilter);
    if (query.trim()) {
      list = list.filter((i) =>
        i.label.toLowerCase().includes(query.trim().toLowerCase())
      );
    }
    return list;
  }, [query, activeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    for (const item of filtered) {
      groups[item.group] = groups[item.group] || [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);

  const flat = filtered;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveFilter("all");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeFilter]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        const item = flat[activeIndex];
        if (item) {
          router.push(item.href);
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, flat, activeIndex, onClose, router]);

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_0px_0px_1px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-neutral-100">
          <FiSearch className="text-neutral-400 text-lg flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links, pages, QR codes, settings, users and more ..."
            className="flex-1 text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <Icon className="text-[13px]" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {flat.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-neutral-400">
              No results found.
            </p>
          )}

          {(["Popular", "Pages", "Settings"] as const).map((groupName) => {
            const groupItems = grouped[groupName];
            if (!groupItems || groupItems.length === 0) return null;

            return (
              <div key={groupName} className="mb-2">
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  {groupName === "Popular" ? "Popular Search" : groupName}
                </p>
                <ul>
                  {groupItems.map((item) => {
                    runningIndex += 1;
                    const isActive = runningIndex === activeIndex;
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onMouseEnter={() => setActiveIndex(runningIndex)}
                          onClick={() => {
                            router.push(item.href);
                            onClose();
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
                            isActive ? "bg-neutral-100" : "hover:bg-neutral-50"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 text-neutral-800 font-medium">
                            <Icon className="text-[15px] text-neutral-500" />
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <span className="flex items-center justify-center w-5 h-5 rounded border border-neutral-200 text-[10px] text-neutral-400">
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 h-11 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FiArrowDown className="text-[11px]" />
              <FiArrowUp className="text-[11px]" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <FiCornerDownLeft className="text-[11px]" />
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}