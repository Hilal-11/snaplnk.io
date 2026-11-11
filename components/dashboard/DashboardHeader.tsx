// components/dashboard/DashboardHeader.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiChevronRight, FiSearch, FiPlus } from "react-icons/fi";
import { AnimatePresence, motion } from "motion/react";
import { routeLabels } from "@/config/routeLabels";
import CommandPalette from "./SearchBox";
import CreateChooserDialog from "./CreateChooserDialog";
import Feedback from "./Feedback";

export default function DashboardHeader() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const segments = pathname.split("/").filter(Boolean); // e.g. ["dashboard", "qr-codes"]
  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = () => setCreateOpen(false);

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
      <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 sticky top-0 z-30">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link
            href="/dashboard"
            aria-label="Dashboard home"
            className="group flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <FiHome className="text-[15px] transition-transform duration-200 group-hover:-translate-y-px" />
          </Link>

          {segments.map((seg, i) => {
            const href = "/" + segments.slice(0, i + 1).join("/");
            const isLast = i === segments.length - 1;
            const label = routeLabels[seg] ?? seg;

            return (
              <span key={href} className="flex items-center gap-1.5">
                <FiChevronRight className="text-neutral-300 text-[13px]" />
                {isLast ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={href}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="font-semibold text-neutral-900"
                    >
                      {label}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <Link
                    href={href}
                    className="text-neutral-400 hover:text-neutral-900 transition-colors underline-offset-4 hover:underline decoration-brand/60"
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
          <button
            onClick={() => setPaletteOpen(true)}
            className="group hidden xl:flex items-center gap-2 w-56 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-white hover:border-neutral-300 hover:text-neutral-600 transition-colors"
          >
            <FiSearch className="text-sm transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] font-medium text-neutral-500 shadow-[0_1px_0_rgb(0_0_0/0.06)]">
              ⌘K
            </kbd>
          </button>

          <Feedback />

          <button
            onClick={() => setCreateOpen(true)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-primary text-white text-sm font-medium"
          >
            <FiPlus className="text-[14px] transition-transform duration-300 ease-out group-hover:rotate-90" />
            Create Link
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_var(--brand-glow)]" />
          </button>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <CreateChooserDialog open={createOpen} onClose={closeCreate} />
    </>
  );
}
