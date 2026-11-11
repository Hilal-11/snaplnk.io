"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  FiChevronUp,
  FiUser,
  FiSettings,
  FiCreditCard,
  FiHelpCircle,
  FiLogOut,
  FiUsers,
} from "react-icons/fi";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{ transformOrigin: "bottom center" }}
            className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0px_6px_12px_-4px_rgba(0,0,0,0.12),0px_16px_32px_-12px_rgba(0,0,0,0.18)]"
          >
            {/* Appearance */}
            <div className="px-1.5 pt-1 pb-2">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                <span className="h-1 w-1 rounded-full bg-brand" />
                Appearance
              </p>
              <ThemeSwitcher layoutId="usermenu-theme-pill" />
            </div>
            <div className="my-1 h-px bg-neutral-100" />
            <MenuItem icon={FiUser} label="View profile" link="/dashboard/profile" index={0} />
            <MenuItem icon={FiSettings} label="Account settings" link="/dashboard/settings" index={1} />
            <MenuItem icon={FiCreditCard} label="Billing" link="#" index={2} />
            <MenuItem icon={FiUsers} label="Invite team members" link="#" index={3} />
            <MenuItem icon={FiHelpCircle} label="Help & docs" link="#" index={4} />
            <div className="my-1 h-px bg-neutral-100" />
            <MenuItem icon={FiLogOut} label="Log out" link="#" destructive index={5} />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex items-center gap-2.5 w-full rounded-lg px-2 py-2 hover:bg-neutral-100 transition-colors duration-150"
      >
        <span className="relative flex items-center justify-center w-8 h-8 rounded-full btn-primary text-xs font-semibold flex-shrink-0">
          H
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
        </span>
        <span className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-neutral-900 truncate">Hilal Ahmad</p>
          <p className="text-xs text-neutral-400 truncate">hilal@snaplnk.io</p>
        </span>
        <FiChevronUp
          className={`text-neutral-400 text-sm transition-transform duration-200 group-hover:text-neutral-700 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  destructive,
  link,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  link?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 * index + 0.04, duration: 0.18 }}
    >
      <Link
        href={link ?? "#"}
        className={`group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          destructive ? "text-red-600 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        <Icon className="text-[15px] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
        {label}
      </Link>
    </motion.div>
  );
}
