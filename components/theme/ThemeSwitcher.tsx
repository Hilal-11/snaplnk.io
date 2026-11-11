"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";

const OPTIONS = [
  { value: "light", label: "Light", icon: FiSun },
  { value: "dark", label: "Dark", icon: FiMoon },
  { value: "system", label: "Default", icon: FiMonitor },
] as const;

const noop = () => () => {};

/** Segmented Light / Dark / Default(system) control with a sliding active pill. */
export default function ThemeSwitcher({ layoutId = "theme-pill" }: { layoutId?: string }) {
  const { theme, setTheme } = useTheme();
  // Theme is only known on the client — render a neutral state on the server.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const current = mounted ? theme ?? "system" : null;

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative grid grid-cols-3 gap-0.5 rounded-lg border border-neutral-200 bg-neutral-100/70 p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={`group relative flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-colors ${
              active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-white shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.04)]"
                transition={{ type: "spring", stiffness: 520, damping: 36 }}
              />
            )}
            <motion.span
              className="relative z-10 flex"
              animate={active ? { rotate: o.value === "light" ? 90 : o.value === "dark" ? -20 : 0, scale: 1.05 } : { rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <o.icon size={12} className={active && o.value !== "system" ? "text-brand" : ""} />
            </motion.span>
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
