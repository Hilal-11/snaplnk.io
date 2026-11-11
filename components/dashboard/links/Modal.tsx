"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const noopSubscribe = () => () => {};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;

  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[oklch(0_0_0/0.45)] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={`relative w-full ${width} max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.35)]`}
          >
            {(title || description) && (
              <div className="relative flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-neutral-100">
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-dots mask-fade-radial opacity-80" />
                <div className="relative min-w-0">
                  {title && <p className="text-base font-semibold text-neutral-900">{title}</p>}
                  {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="group relative p-1.5 -mr-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                >
                  <FiX className="transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>
            )}
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50/60">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.97] text-sm font-semibold text-neutral-700 transition disabled:opacity-50 ${className}`}
    />
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }
) {
  const { className = "", danger, ...rest } = props;
  return (
    <button
      {...rest}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
        danger ? "bg-red-600 hover:bg-red-700" : "btn-primary"
      } ${className}`}
    />
  );
}
