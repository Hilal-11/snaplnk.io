"use client";

import { AnimatePresence, motion } from "motion/react";
import { FiAlertCircle, FiCheck } from "react-icons/fi";

export const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-neutral-400 hover:border-neutral-300 focus:border-brand/60 focus:bg-white focus:shadow-[0_0_0_3px_var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-60";

export function SettingsCard({
  title,
  description,
  children,
  footer,
  danger,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border bg-white ${
        danger ? "border-red-200" : "border-neutral-200/80"
      } shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.06)]`}
    >
      <div className={`border-b px-5 py-4 ${danger ? "border-red-100 bg-red-50/40" : "border-neutral-100"}`}>
        <h3 className={`text-sm font-semibold ${danger ? "text-red-700" : "text-neutral-900"}`}>{title}</h3>
        {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/60 px-5 py-3">
          {footer}
        </div>
      )}
    </section>
  );
}

/** Label + hint on the left, control on the right (stacks on mobile). */
export function SettingRow({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between [&+&]:border-t [&+&]:border-neutral-100">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-neutral-300"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${checked ? "right-0.5" : "left-0.5"}`}
      />
    </button>
  );
}

export function Segmented<T extends string | number | null>({
  value,
  options,
  onChange,
  label,
  layoutId,
  disabled,
}: {
  value: T;
  options: readonly { value: T; label: string; icon?: React.ComponentType<{ size?: number }> }[];
  onChange: (v: T) => void;
  label: string;
  layoutId: string;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              active ? "text-white" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md btn-primary"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            {o.icon && (
              <span className="relative z-10">
                <o.icon size={13} />
              </span>
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type Status = { kind: "success" | "error"; message: string } | null;

export function StatusMessage({ status }: { status: Status }) {
  return (
    <AnimatePresence>
      {status && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role={status.kind === "error" ? "alert" : "status"}
          className={`flex items-center gap-1.5 text-xs font-medium ${status.kind === "error" ? "text-red-600" : "text-emerald-700"}`}
        >
          {status.kind === "error" ? <FiAlertCircle size={13} /> : <FiCheck size={13} />}
          {status.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Small floating confirmation used after instant-save settings. */
export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: "-50%", y: 16 }}
          animate={{ opacity: 1, x: "-50%", y: 0 }}
          exit={{ opacity: 0, x: "-50%", y: 10 }}
          role="status"
          className="fixed bottom-6 left-1/2 z-[120] flex items-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <FiCheck size={14} /> {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
