"use client";

import Logo from "@/components/Logo";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="font-sans flex min-h-screen bg-neutral-50 relative">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[oklch(0_0_0/0.4)] backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 w-68 bg-white shadow-xl"
            >
              <Sidebar mobile />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — mobile only, holds the menu trigger */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2 px-1">
            <Logo size={28} />
            <span className="font-semibold text-neutral-900 tracking-tight">
              Snaplnk<span className="text-brand">.</span>io
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-neutral-100 active:scale-95 transition"
          >
            <FiMenu className="text-lg text-neutral-700" />
          </button>
        </header>
        <DashboardHeader />
        <main className="relative flex-1 p-4 lg:p-8">
          {/* Decorative grid band: only the top of each page, fading out */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid mask-fade-radial" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
