"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  FiChevronDown,
  FiHome,
  FiLink,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import Image from "next/image";

export default function HeaderAuthSection() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return <div className="w-24 h-8 rounded-md bg-neutral-100 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/signup"
        className="z-50 px-3 py-1.5 rounded-md text-[14.5px] font-sans font-medium text-gray-800 hover:text-neutral-700 hover:underline transition-colors duration-300 select-none"
      >
        Sign up
      </Link>
    );
  }


    const initial = (user.user_metadata?.name || user.email || "U")
      .charAt(0)
      .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white hover:bg-neutral-50 transition-colors duration-150"
      >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-semibold">
            {initial}
          </span>
      </button>

      {open && (
        <>
          {/* click-outside overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06)] z-50">
            <div className="px-2.5 py-2 mb-1 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {user.user_metadata?.name || "Account"}
              </p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>

            <MenuLink href="/dashboard" icon={FiHome} label="Dashboard" onClick={() => setOpen(false)} />
            <MenuLink href="/dashboard/links" icon={FiLink} label="My Links" onClick={() => setOpen(false)} />
            <MenuLink href="/dashboard/settings" icon={FiUser} label="Profile" onClick={() => setOpen(false)} />
            <MenuLink href="/dashboard/settings" icon={FiSettings} label="Settings" onClick={() => setOpen(false)} />

            <div className="my-1 h-px bg-neutral-100" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <FiLogOut className="text-[15px]" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors duration-150"
    >
      <Icon className="text-[15px]" />
      {label}
    </Link>
  );
}