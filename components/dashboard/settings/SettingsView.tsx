"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  FiAlertTriangle,
  FiDatabase,
  FiDroplet,
  FiShield,
  FiSliders,
  FiUser,
  FiKey,
} from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import { PageTitle } from "@/components/dashboard/links/CollectionToolbar";
import { useUser } from "@/hooks/useUser";
import {
  AccountSection,
  AppearanceSection,
  DangerSection,
  DataSection,
  PreferencesSection,
  ProfileSection,
  SecuritySection,
  type SectionProps,
} from "./sections";
import { Toast } from "./ui";
import type { SettingsTab } from "./tabs";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", hint: "Name and account details", icon: FiUser, Component: ProfileSection },
  { id: "account", label: "Account", hint: "Email, password, sign-in", icon: FiKey, Component: AccountSection },
  { id: "preferences", label: "Preferences", hint: "Defaults for new links", icon: FiSliders, Component: PreferencesSection },
  { id: "appearance", label: "Appearance", hint: "Theme, motion, layout", icon: FiDroplet, Component: AppearanceSection },
  { id: "security", label: "Security", hint: "Sessions and activity", icon: FiShield, Component: SecuritySection },
  { id: "data", label: "Data", hint: "Export your data", icon: FiDatabase, Component: DataSection },
  { id: "danger", label: "Danger zone", hint: "Delete links or account", icon: FiAlertTriangle, Component: DangerSection },
] as const satisfies readonly {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  Component: React.ComponentType<SectionProps>;
}[];

// Keep in sync with ./tabs.ts (the server page validates ?tab= against that list).
const _check: readonly SettingsTab[] = SETTINGS_TABS.map((t) => t.id);
void _check;

export default function SettingsView({ initialTab }: { initialTab: SettingsTab }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = SETTINGS_TABS.find((t) => t.id === tab) ?? SETTINGS_TABS[0];

  function select(id: SettingsTab) {
    setTab(id);
    router.replace(`/dashboard/settings?tab=${id}`, { scroll: false });
  }

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  return (
    <div className="max-w-full mx-auto">
      <PageTitle title="Settings" subtitle="Manage your profile, account, preferences and data." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Nav: vertical on desktop, scrollable pills on mobile */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto scrollbar-hide rounded-xl border border-neutral-200 bg-white p-1 lg:flex-col">
            {SETTINGS_TABS.map((t) => {
              const isActive = t.id === tab;
              const danger = t.id === "danger";
              return (
                <li key={t.id} className="shrink-0">
                  <button
                    onClick={() => select(t.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : danger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="settings-nav-pill"
                        className={`absolute inset-0 rounded-lg ${danger ? "bg-red-600" : "btn-primary"}`}
                        transition={{ type: "spring", stiffness: 480, damping: 38 }}
                      />
                    )}
                    <t.icon size={15} className="relative z-10 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="relative z-10 min-w-0">
                      <span className="block whitespace-nowrap">{t.label}</span>
                      <span className={`hidden lg:block truncate text-[11px] font-normal ${isActive ? "opacity-70" : "text-neutral-400"}`}>
                        {t.hint}
                      </span>
                    </span>
                    {isActive && !danger && (
                      <span className="relative z-10 ml-auto hidden h-1.5 w-1.5 rounded-full bg-brand lg:block" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Section */}
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900">
              <active.icon size={17} className={active.id === "danger" ? "text-red-600" : "text-neutral-500"} />
              {active.label}
            </h2>
            <p className="text-xs text-neutral-500">{active.hint}</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-5 py-4 w-fit">
              <Spinner className="size-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">Loading your settings...</span>
            </div>
          ) : !user ? (
            <p className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">Please sign in again.</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <active.Component user={user} notify={notify} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
