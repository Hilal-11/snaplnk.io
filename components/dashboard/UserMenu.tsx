"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiChevronUp,
  FiUser,
  FiSettings,
  FiCreditCard,
  FiHelpCircle,
  FiLogOut,
  FiUsers,
} from "react-icons/fi";
import Link  from "next/link"

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full rounded-xl border border-neutral-200 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06)]">
          <MenuItem icon={FiUser} label="View profile" link="dashboard/profile"/>
          <MenuItem icon={FiSettings} label="Account settings" link="dashboard/settings" />
          <MenuItem icon={FiCreditCard} label="Billing" link="" />
          <MenuItem icon={FiUsers} label="Invite team members" link="" />
          <MenuItem icon={FiHelpCircle} label="Help & docs" link="" />
          <div className="my-1 h-px bg-neutral-100" />
          <MenuItem icon={FiLogOut} label="Log out" link="" destructive />
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full rounded-lg px-2 py-2 hover:bg-neutral-100 transition-colors duration-150"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-xs font-semibold flex-shrink-0">
          H
        </span>
        <span className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-neutral-900 truncate">
            Hilal Ahmad
          </p>
          <p className="text-xs text-neutral-400 truncate">
            hilal@snaplnk.io
          </p>
        </span>
        <FiChevronUp
          className={`text-neutral-400 text-sm transition-transform duration-150 ${
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
  link
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  link?: string
}) {
  return (
    <Link href={link}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <Icon className="text-[15px]" />
      {label}
    </Link>
  );
}