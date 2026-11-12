"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
} from "react-icons/fi";
import { BiSolidTerminal } from "react-icons/bi";
import { MdOutlinePriceChange } from "react-icons/md";
import { LiaBlogSolid } from "react-icons/lia";
import { MdOutlineDataUsage } from "react-icons/md";
import { IoListSharp } from "react-icons/io5";
import { TiDocumentText } from "react-icons/ti";
import { TbQrcode } from "react-icons/tb";
import { HiOutlineExternalLink } from "react-icons/hi";
import UserMenu from "./UserMenu";
import { motion } from "motion/react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: FiHome },
      { href: "/dashboard/links", label: "My Links", icon: FiLink },
      { href: "/dashboard/analytics", label: "Analytics", icon: FiBarChart2 },
      { href: "/dashboard/qr-codes", label: "QR Codes", icon: TbQrcode },
      { href: "/dashboard/bio-pages", label: "Bio Pages", icon: FiUser },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/archived", label: "Archived Links", icon: FiArchive },
      { href: "/dashboard/expired", label: "Expired Links", icon: FiClock },
      { href: "/dashboard/deleted", label: "Deleted Links", icon: FiTrash2 },
      { href: "/dashboard/tags", label: "Tags", icon: FiTag },
      { href: "/dashboard/domains", label: "Domains", icon: FiGlobe },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: FiSettings },
    ],
  },
];

const ExternalPages = [
  {
    items: [
      { href: "/pricing", label: "Pricing", icon: MdOutlinePriceChange },
      { href: "/usage", label: "Usage", icon: MdOutlineDataUsage },
      { href: "/faqs", label: "FAQ's", icon: IoListSharp },
      { href: "/blogs", label: "Blogs", icon: LiaBlogSolid },
      { href: "https://hila-11.com", label: "Lokalhost.io", icon: BiSolidTerminal },
    ],
  },
]


export default function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  // Separate layout ids so the desktop and mobile instances never animate into each other.
  const pillId = mobile ? "sidebar-pill-mobile" : "sidebar-pill";

  return (
    <aside
      className={`font-sans flex-col w-68 scrollbar-hide h-screen sticky top-0 border-r border-neutral-200/80 bg-white ${
        mobile ? "flex" : "hidden lg:flex"
      }`}
    >
      {/* Logo */}
      <Link
        href="/"
        className="group relative flex items-center gap-2 px-5 h-16 border-b border-neutral-200/70 overflow-hidden"
      >
        <span className="pointer-events-none absolute inset-0 bg-dots mask-fade-radial opacity-70" />
        <span className="relative transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
          <Logo size={30} />
        </span>
        <span className="relative font-semibold text-lg text-neutral-900 tracking-tight">
          Snaplnk<span className="text-brand">.</span>io
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 scrollbar-hide overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="flex items-center gap-1.5 px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              <span className="h-px w-2 bg-neutral-300" />
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                const Icon = item.icon;
                if ("disabled" in item && item.disabled) {
                  return (
                    <li key={item.href}>
                      <span className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 cursor-not-allowed select-none">
                        <Icon className="text-[15px] text-neutral-300" />
                        {item.label}
                        <span className="ml-auto text-[10px] font-semibold text-neutral-400 bg-neutral-100 rounded-md px-1.5 py-0.5">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive ? "text-white" : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={pillId}
                          className="absolute inset-0 rounded-lg btn-primary"
                          transition={{ type: "spring", stiffness: 480, damping: 38 }}
                        />
                      )}
                      <Icon
                        className={`relative z-10 text-[15px] transition-transform duration-200 ease-out group-hover:scale-110 ${
                          isActive ? "" : "text-neutral-500 group-hover:text-neutral-900 group-hover:-rotate-6"
                        }`}
                      />
                      <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.08 }}
                          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand-glow)]"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="relative w-full h-auto overflow-hidden bg-neutral-100/70 rounded-lg border border-neutral-200 py-2 px-1.5">
          <span className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" />
          <ul className="relative">
            {ExternalPages[0].items.map((pages) => {
              const isActive = pathname === pages.href;
              const Icon = pages.icon;
              return (
                <li key={pages.href}>
                  <Link
                    href={pages.href}
                    className={`group relative w-full flex items-center gap-2.5 px-3 py-[5px] rounded-md text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "btn-primary text-white"
                        : "text-neutral-500 hover:bg-white hover:text-neutral-950 hover:shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
                    }`}
                  >
                    <Icon className={`text-[15px] ${isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-900"}`} />
                    {pages.label}
                    <span className="absolute right-3 text-neutral-400 transition-all duration-200 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <HiOutlineExternalLink />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User menu pinned to bottom */}
      <div className="px-2 py-1.5 border-t border-neutral-200/70">
        <UserMenu />
      </div>
    </aside>
  );
}
