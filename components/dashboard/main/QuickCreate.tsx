"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiCopy,
  FiCornerDownRight,
  FiDownload,
  FiLink,
  FiSettings,
  FiShare2,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import { downloadQr, shareUrl } from "@/components/dashboard/links/utils";
import type { LinkItem } from "@/components/dashboard/links/types";

type Mode = "link" | "qr";

export default function QuickCreate() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("link");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return setError("Paste a long URL to get started");
    }
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_url: withProtocol }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Something went wrong");
      setCreated(json.data as LinkItem);
      setUrl("");
      router.refresh(); // update Recent links
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const advancedHref = `${mode === "qr" ? "/dashboard/qr-codes/new" : "/dashboard/links/new"}${
    url.trim() ? `?url=${encodeURIComponent(url.trim())}` : ""
  }`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] mb-6">
      {/* subtle dotted backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div className="relative px-5 py-8 sm:px-10 sm:py-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* mode switch */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 mb-5">
            {(
              [
                { key: "link", label: "Short link", icon: FiLink },
                { key: "qr", label: "QR code", icon: TbQrcode },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setMode(m.key);
                  inputRef.current?.focus();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mode === m.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <m.icon size={13} /> {m.label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {mode === "qr" ? "Turn any link into a QR code" : "Shorten a link in one click"}
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            {mode === "qr"
              ? "Paste a URL — we'll create a trackable short link and a downloadable QR code."
              : "Paste a long URL — you get a short link, a QR code and click analytics, instantly."}
          </p>

          <form onSubmit={create} className="mt-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm focus-within:border-neutral-400 focus-within:shadow-md transition-all">
              <div className="flex items-center flex-1 min-w-0">
                <span className="pl-2.5 pr-1.5 flex items-center">
                  <Image src="/snaplinklogolight.svg" width={20} height={20} alt="" />
                </span>
                <input
                  ref={inputRef}
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-very-long-link"
                  className="flex-1 min-w-0 bg-transparent py-2.5 pr-2 text-sm font-medium outline-none placeholder:text-neutral-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-sm font-semibold px-5 py-2.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="size-4" /> Creating
                  </>
                ) : (
                  <>
                    {mode === "qr" ? "Generate QR" : "Shorten"} <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            {error ? (
              <p className="font-medium text-red-500">{error}</p>
            ) : (
              <Link
                href={advancedHref}
                className="inline-flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-900"
              >
                <FiSettings size={12} /> More options — custom back-half, tags, expiry
              </Link>
            )}
          </div>

          {created && (
            <div className="mt-6 text-left rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-1">
              {created.qr_code_url && (
                <img
                  src={created.qr_code_url}
                  alt="QR code"
                  className={`shrink-0 rounded-lg border border-neutral-200 bg-white p-1 ${mode === "qr" ? "w-24 h-24" : "w-14 h-14"}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <a
                  href={getShortUrl(created.short_code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-bold text-blue-600 hover:underline truncate block"
                >
                  {getShortUrlDisplay(created.short_code)}
                </a>
                <p className="flex items-center gap-1 text-xs text-neutral-500 min-w-0">
                  <FiCornerDownRight size={12} className="shrink-0" />
                  <span className="truncate">{created.original_url}</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <ResultBtn
                    onClick={async () => {
                      await navigator.clipboard.writeText(getShortUrl(created.short_code));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />} {copied ? "Copied" : "Copy"}
                  </ResultBtn>
                  <ResultBtn onClick={() => shareUrl(getShortUrl(created.short_code))}>
                    <FiShare2 /> Share
                  </ResultBtn>
                  {created.qr_code_url && (
                    <ResultBtn onClick={() => downloadQr(created.qr_code_url!, created.short_code)}>
                      <FiDownload /> QR
                    </ResultBtn>
                  )}
                  <Link
                    href={`/dashboard/analytics?link=${created.id}`}
                    className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-700"
                  >
                    <FiBarChart2 /> Analytics
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors"
    >
      {children}
    </button>
  );
}
