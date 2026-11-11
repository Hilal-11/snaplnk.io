"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

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

  if (!open || typeof document === "undefined") return null;

  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} max-h-[90vh] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-150`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-neutral-100">
            <div className="min-w-0">
              {title && <p className="text-base font-semibold text-neutral-900">{title}</p>}
              {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 -mr-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <FiX />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold text-neutral-700 transition-colors disabled:opacity-50 ${className}`}
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
        danger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-neutral-800"
      } ${className}`}
    />
  );
}
