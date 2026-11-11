"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiLink, FiUser } from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import Modal from "./links/Modal";

const OPTIONS = [
  {
    key: "1",
    href: "/dashboard/links/new",
    title: "Short link",
    description: "Shorten a long URL, add tags and track every click.",
    icon: FiLink,
    preview: (
      <div className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left">
        <p className="text-[11px] font-semibold text-blue-600 truncate">snaplnk.io/4jaX5mR</p>
        <p className="text-[10px] text-neutral-400 truncate">↳ https://example.com/very-long...</p>
      </div>
    ),
  },
  {
    key: "2",
    href: "/dashboard/qr-codes/new",
    title: "QR code",
    description: "Generate a trackable QR code for any website.",
    icon: TbQrcode,
    preview: (
      <div className="w-14 h-14 rounded-lg border border-neutral-200 bg-white p-1.5 grid grid-cols-5 grid-rows-5 gap-[2px]">
        {[1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1].map((on, i) => (
          <span key={i} className={on ? "bg-neutral-900 rounded-[1px]" : ""} />
        ))}
      </div>
    ),
  },
  {
    key: "3",
    href: "/dashboard/bio-pages/new",
    title: "Bio page",
    description: "One link in bio for all your links and socials.",
    icon: FiUser,
    preview: (
      <div className="w-16 rounded-lg border border-neutral-200 bg-white p-1.5 flex flex-col items-center gap-1">
        <span className="w-4 h-4 rounded-full bg-neutral-900" />
        <span className="w-full h-1.5 rounded bg-neutral-200" />
        <span className="w-full h-1.5 rounded bg-neutral-200" />
        <span className="w-full h-1.5 rounded bg-neutral-200" />
      </div>
    ),
  },
] as const;

export default function CreateChooserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  function go(href: string) {
    onClose();
    router.push(href);
  }

  // 1 / 2 / 3 keyboard shortcuts while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const opt = OPTIONS.find((o) => o.key === e.key);
      if (opt && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        onClose();
        router.push(opt.href);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} size="lg" title="What do you want to create?" description="Pick one to get started — you can always create the others later.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.href}
            onClick={() => go(o.href)}
            className="group text-left rounded-xl border border-neutral-200 bg-white p-4 hover:border-brand/60 hover:shadow-[0px_12px_28px_-12px_var(--brand-glow)] hover-lift active:scale-[0.98] flex flex-col"
          >
            <div className="relative isolate overflow-hidden h-24 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center px-3 mb-4 transition-colors group-hover:bg-neutral-100">
              <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
              <span className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-2">
              {o.preview}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
                <o.icon size={15} />
              </span>
              <p className="text-sm font-semibold text-neutral-900">{o.title}</p>
              <kbd className="ml-auto rounded border border-neutral-200 bg-neutral-50 px-1.5 text-[10px] font-medium text-neutral-400">
                {o.key}
              </kbd>
            </div>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{o.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              Get started <FiArrowRight size={12} />
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
