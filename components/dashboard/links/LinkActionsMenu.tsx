"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMoreHorizontal } from "react-icons/fi";

export interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Draws a divider above this item. */
  separated?: boolean;
}

const MENU_WIDTH = 224;

export default function LinkActionsMenu({ items, size = "md" }: { items: MenuItem[]; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "mousedown") {
        const t = e.target as Node;
        if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      const estimatedHeight = items.length * 40 + 24;
      const openUp = r.bottom + estimatedHeight > window.innerHeight - 8 && r.top > estimatedHeight;
      const left = Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
      setStyle(openUp ? { bottom: window.innerHeight - r.top + 6, left } : { top: r.bottom + 6, left });
    }
    setOpen((v) => !v);
  }

  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="More actions"
        aria-expanded={open}
        title="More"
        className={`${dim} flex items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors ${
          open ? "bg-neutral-100 text-neutral-900" : ""
        }`}
      >
        <FiMoreHorizontal size={17} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ ...style, width: MENU_WIDTH }}
            className="fixed z-[105] font-sans bg-white border border-neutral-200 rounded-xl shadow-lg shadow-neutral-900/10 p-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            {items.map((item) => (
              <div key={item.label}>
                {item.separated && <div className="my-1.5 h-px bg-neutral-100" />}
                <button
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    item.danger ? "text-red-600 hover:bg-red-50" : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
