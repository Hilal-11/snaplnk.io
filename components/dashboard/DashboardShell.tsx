"use client";

import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar";
import Image from "next/image";
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
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <Sidebar mobile />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — mobile only, holds the menu trigger */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-neutral-200 bg-white sticky top-0 z-40">
          {/* Logo */}
            <div className="flex items-center gap-2 px-1 h-16 border-b border-neutral-200/70">
              <Image src={"/snaplinklogolight.svg"} width={30} height={30} alt={"snaplnk.io"} />
            </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-neutral-100"
          >
            <FiMenu className="text-lg text-neutral-700" />
          </button>
        </header>
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}