"use client";

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
import Image from "next/image";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: FiHome },
      { href: "/dashboard/links", label: "My Links", icon: FiLink },
      { href: "/dashboard/analytics", label: "Analytics", icon: FiBarChart2 },
      { href: "/dashboard/qr-codes", label: "QR Codes", icon: TbQrcode },
      { href: "/dashboard/bio-pages", label: "Bio Pages", icon: FiUser, disabled: true },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/archived", label: "Archived Links", icon: FiArchive },
      { href: "/dashboard/expired", label: "Expired Links", icon: FiClock },
      { href: "/dashboard/deleted", label: "Deleted Links", icon: FiTrash2 },
      { href: "/dashboard/tags", label: "Tags", icon: FiTag },
      { href: "/dashboard/domains", label: "Domains", icon: FiGlobe, disabled: true },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/team", label: "Team", icon: FiUsers, disabled: true },
      { href: "/dashboard/api-keys", label: "API Keys", icon: FiKey, disabled: true },
      { href: "/dashboard/billing", label: "Billing", icon: FiCreditCard, disabled: true },
      { href: "/dashboard/settings", label: "Settings", icon: FiSettings },
    ],
  },
];

const ExternalPages = [
  {
    items: [
      { href: "/pricing", label: "Pricing", icon: MdOutlinePriceChange },
      { href: "/usage", label: "Usage", icon: MdOutlineDataUsage },
      { href: "/docs", label: "API's", icon: TiDocumentText },
      { href: "/faqs", label: "FAQ's", icon: IoListSharp },
      { href: "/blogs", label: "Blogs", icon: LiaBlogSolid },
      { href: "https://hila-11.com", label: "Lokalhost.io", icon: BiSolidTerminal },
    ],
  },
]

export default function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={`font-sans flex-col w-68 scrollbar-hide h-screen sticky top-0 border-r border-neutral-200/80 bg-white ${
        mobile ? "flex" : "hidden lg:flex"
      }`}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-neutral-200/70">
        <Image src={"/snaplinklogolight.svg"} width={30} height={30} alt={"snaplnk.io"} />
        <span className="font-semibold text-lg text-gray-900 tracking-tight">
          Snaplnk.io
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 scrollbar-hide overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {group.label}
            </p>
            <ul className="">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <li key={item.href}>
                      <span className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 cursor-not-allowed select-none">
                        <Icon className="text-[15px] text-neutral-300" />
                        {item.label}
                        <span className="ml-auto text-[10px] font-semibold text-neutral-300 bg-neutral-100 rounded-full px-1.5 py-0.5">Soon</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-black text-white"
                          : "text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950"
                      }`}
                    >
                      <Icon
                        className={`text-[15px] ${
                          isActive ? "text-white" : "text-neutral-800"
                        }`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="w-full h-auto bg-neutral-100 rounded-lg border border-neutral-300/50 py-3 px-2">
          <ul className="">
              {ExternalPages[0].items.map((pages) => {
                const isActive = pathname === pages.href;
                const Icon = pages.icon;
                return (
                  <li key={pages.href}>
                    <Link
                      href={pages.href}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-[5px] rounded-sm text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-black text-white"
                          : "text-neutral-500 hover:bg-white hover:text-neutral-950"
                      }`}
                    >
                      <Icon
                        className={`text-[15px] ${
                          isActive ? "text-white" : "text-neutral-500"
                        }`}
                      />
                      {pages.label}

                      <span className="absolute right-4"><HiOutlineExternalLink /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
        </div>

      </nav>

      {/* User menu pinned to bottom */}
      <div className="px-2 py-px">
        <UserMenu />
      </div>
    </aside>
  );
}