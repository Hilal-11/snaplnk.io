"use client";

import { useEffect, useState, useRef } from "react";
import {
  FiSearch,
  FiFilter,
  FiSettings,
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiGlobe,
  FiEdit2,
  FiArchive,
  FiTrash2,
  FiExternalLink,
  FiBarChart2,
  FiCheck,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const TABS = [
  { key: "all", label: "All Links" },
  { key: "archived", label: "Archived" },
  { key: "bin", label: "Bin" },
  { key: "analytics", label: "Analytics" },
  { key: "domains", label: "Domains" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface LinkRow {
  id: string;
  title: string | null;
  original_url: string;
  short_code: string;
  domain: string;
  tags: string[];
  is_active: boolean;
  is_custom_alias: boolean;
  clicks_count: number;
  unique_clicks_count: number;
  favicon_url: string | null;
  created_at: string;
  last_clicked_at: string | null;
  archived_link: boolean;
  is_deleted: boolean;
}

const columns = [
  { key: "link", label: "Link" },
  { key: "originalUrl", label: "Original URL" },
  { key: "tags", label: "Tags" },
  { key: "clicks", label: "Clicks" },
  { key: "unique", label: "Unique" },
  { key: "status", label: "Status" },
  { key: "created", label: "Created" },
  { key: "lastClick", label: "Last Click" },
];

const cellBorder = "border-r border-neutral-100";

export default function LinksTable() {
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);


  useEffect(() => {
    setLoading(true);
    fetch(`/api/links?view=${tab}`)
      .then((r) => r.json())
      .then((json) => setLinks(json.data ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedButton = Object.values(buttonRefs.current).some((btn) =>
        btn?.contains(target)
      );
      if (menuRef.current && !menuRef.current.contains(target) && !clickedButton) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = links.filter(
    (l) =>
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.original_url.toLowerCase().includes(search.toLowerCase()) ||
      l.short_code.toLowerCase().includes(search.toLowerCase())
  );


    function copyLink(linkId: string, domain: string, shortCode: string) {
    navigator.clipboard.writeText(`http://${domain}/${shortCode}`);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId((current) => (current === linkId ? null : current)), 1500);
    }

    function toggleMenu(linkId: string) {
    if (openMenuId === linkId) {
        setOpenMenuId(null);
        return;
    }
    const btn = buttonRefs.current[linkId];
    if (btn) {
        const rect = btn.getBoundingClientRect();
        setMenuPos({
        top: rect.bottom + 4,        // ✅ no scrollY
        left: rect.right - 192,      // ✅ no scrollX
        });
    }
    setOpenMenuId(linkId);
    }

  const activeLink = filtered.find((l) => l.id === openMenuId);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 pt-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-black text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 flex-1 max-w-sm border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 focus-within:border-neutral-400 transition-colors">
          <FiSearch className="text-neutral-400 text-sm flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
            <FiFilter className="text-[13px]" />
            Filters
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50">
            <FiSettings className="text-sm" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 font-medium text-neutral-500 text-xs ${cellBorder}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2.5 w-10">Copy</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-50">
                  <td colSpan={columns.length + 2} className="px-4 py-3">
                    <div className="h-8 rounded-md bg-neutral-100 animate-pulse" />
                  </td>
                </tr>
              ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-10 text-center text-sm text-neutral-400">
                  No links found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((link) => (
                <tr key={link.id} className="border-b border-neutral-50 hover:bg-neutral-50/60 transition-colors">
                  {/* Link — favicon instead of QR */}
                  <td className={`px-4 py-3 ${cellBorder}`}>
                    <div className="flex items-center gap-2.5">
                      {link.favicon_url ? (
                        <img
                          src={link.favicon_url}
                          alt=""
                          className="w-6 h-6 rounded-full border border-neutral-200 flex-shrink-0 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <FiGlobe className="text-neutral-400 text-xs" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate max-w-[140px]">
                          {link.title || `${link.domain}/${link.short_code}`}
                        </p>
                        <p className="text-xs text-neutral-400 truncate max-w-[140px]">
                          {link.domain}/{link.short_code}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className={`px-4 py-3 text-neutral-500 max-w-[220px] truncate ${cellBorder}`}>
                    {link.original_url}
                  </td>

                  <td className={`px-4 py-3 ${cellBorder}`}>
                    <div className="flex flex-wrap gap-1">
                      {link.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-neutral-100 text-[11px] font-medium text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className={`px-4 py-3 font-semibold text-neutral-900 ${cellBorder}`}>
                    {link.clicks_count}
                  </td>
                  <td className={`px-4 py-3 text-neutral-500 ${cellBorder}`}>
                    {link.unique_clicks_count}
                  </td>

                  <td className={`px-4 py-3 ${cellBorder}`}>
                    {link.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-neutral-700">
                        <FiCheckCircle className="text-[12px]" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-neutral-400">
                        <FiXCircle className="text-[12px]" /> Inactive
                      </span>
                    )}
                  </td>

                  <td className={`px-4 py-3 text-neutral-500 whitespace-nowrap ${cellBorder}`}>
                    {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                  </td>

                  <td className={`px-4 py-3 text-neutral-500 whitespace-nowrap ${cellBorder}`}>
                    {link.last_clicked_at
                      ? formatDistanceToNow(new Date(link.last_clicked_at), { addSuffix: true })
                      : "—"}
                  </td>

                  {/* Copy button */}
                  <td className={`px-4 py-3 ${cellBorder}`}>
                    {/* row copy button */}
                    <button
                    onClick={() => copyLink(link.id, link.domain, link.short_code)}
                    title="Copy link"
                    className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                    {copiedId === link.id ? (
                        <FiCheck className="text-sm text-neutral-700" />
                    ) : (
                        <FiCopy className="text-sm" />
                    )}
                    </button>
                  </td>

                  {/* 3-dot trigger only — menu itself renders outside the table below */}
                  <td className="px-4 py-3">
                    <button
                      ref={(el) => {
                        buttonRefs.current[link.id] = el;
                      }}
                      onClick={() => toggleMenu(link.id)}
                      className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                      <FiMoreVertical className="text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Menu rendered outside the scrollable table area, fixed-positioned — avoids clipping */}
      {openMenuId && menuPos && activeLink && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
          className="z-50 w-48 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06)]"
        >
          <RowMenuItem icon={FiEdit2} label="Update link" />
        <RowMenuItem
        icon={copiedId === activeLink.id ? FiCheck : FiCopy}
        label={copiedId === activeLink.id ? "Copied" : "Copy link"}
        onClick={() => {
            copyLink(activeLink.id, activeLink.domain, activeLink.short_code);
        }}
        />
          <RowMenuItem icon={FiExternalLink} label="Open original" />
          <RowMenuItem icon={FiBarChart2} label="View analytics" />
          <RowMenuItem
            icon={FiArchive}
            label={activeLink.archived_link ? "Unarchive" : "Archive link"}
          />
          <div className="my-1 h-px bg-neutral-100" />
          <RowMenuItem icon={FiTrash2} label="Delete link" destructive />
        </div>
      )}
    </div>
  );
}

function RowMenuItem({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
        destructive ? "text-red-600 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <Icon className="text-[15px]" />
      {label}
    </button>
  );
}