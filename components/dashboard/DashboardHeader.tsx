// components/dashboard/DashboardHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiHome,
  FiChevronRight,
  FiSearch,
  FiShare2,
  FiPlus,
  FiMoreHorizontal,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { routeLabels } from "@/config/routeLabels";
import CommandPalette from "./SearchBox";
export default function DashboardHeader() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const segments = pathname.split("/").filter(Boolean); // e.g. ["dashboard", "qr-codes"]


  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);



  return (
    <>
      <header className="absolute top-0 hidden lg:flex items-center justify-between h-16 px-6 border-b border-neutral-200 bg-white sticky top-0 z-30">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <FiHome className="text-[15px]" />
          </Link>

          {segments.map((seg, i) => {
            const href = "/" + segments.slice(0, i + 1).join("/");
            const isLast = i === segments.length - 1;
            const label = routeLabels[seg] ?? seg;

            return (
              <span key={href} className="flex items-center gap-1.5">
                <FiChevronRight className="text-neutral-300 text-[13px]" />
                {isLast ? (
                  <span className="font-medium text-neutral-900">{label}</span>
                ) : (
                  <Link
                    href={href}
                    className="text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden xl:block">
           <button
            onClick={() => setPaletteOpen(true)}
            className="hidden xl:flex items-center gap-2 w-56 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100 transition-colors"
          >
            <FiSearch className="text-sm" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] text-neutral-400">
              ⌘K
            </kbd>
          </button>
          </div>


          {/* Create link */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
            <FiPlus className="text-[14px]" />
            Create Link
          </button>
          {/* Theme toggle */}
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}