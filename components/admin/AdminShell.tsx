"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FiArrowLeft, FiGrid, FiLogOut, FiShield } from "react-icons/fi";
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

// Pages are added here as each phase ships.
const NAV = [{ href: "/admin", label: "Overview", icon: FiGrid }];

export default function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200/80 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200/70 px-5">
          <Logo size={26} />
          <span className="font-semibold tracking-tight text-neutral-900">
            Snaplnk<span className="text-brand">.</span>io
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            <FiShield size={9} /> Admin
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                {active && (
                  <motion.span layoutId="admin-nav-pill" className="absolute inset-0 rounded-lg btn-primary" transition={{ type: "spring", stiffness: 480, damping: 38 }} />
                )}
                <item.icon size={15} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-neutral-200/70 p-3">
          <ThemeSwitcher layoutId="admin-theme-pill" />
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
            <FiArrowLeft size={14} /> Back to app
          </Link>
          <div className="flex items-center gap-2 px-1">
            <p className="min-w-0 flex-1 truncate text-xs text-neutral-500" title={email}>
              {email}
            </p>
            <form action="/admin/logout" method="post">
              <button type="submit" aria-label="Sign out of admin" title="Sign out of admin" className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600">
                <FiLogOut size={14} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <FiShield /> Admin
          </span>
          <form action="/admin/logout" method="post">
            <button type="submit" className="text-xs font-semibold text-neutral-600">
              Sign out
            </button>
          </form>
        </header>
        <main className="relative flex-1 p-4 lg:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-grid mask-fade-radial" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
