"use client";

import Link from "next/link";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getBaseUrl, getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiCornerDownRight,
  FiDownload,
  FiGlobe,
  FiHash,
  FiLink,
  FiShare2,
  FiTag,
  FiType,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import { TagInput } from "@/components/dashboard/links/TagInput";
import { FormField } from "@/components/dashboard/links/LinkDialogs";
import { downloadQr, faviconFor, hostnameOf, shareUrl } from "@/components/dashboard/links/utils";
import type { LinkItem } from "@/components/dashboard/links/types";
import { usePrefs } from "@/hooks/usePrefs";
import { expiryFromPrefs, expiryLabel } from "@/lib/prefs";

type Variant = "link" | "qr";

const COPY: Record<Variant, { title: string; subtitle: string; button: string; back: string; backLabel: string }> = {
  link: {
    title: "Create a short link",
    subtitle: "Paste a long URL, customise it, and get a trackable short link with a QR code included.",
    button: "Create short link",
    back: "/dashboard/links",
    backLabel: "Back to links",
  },
  qr: {
    title: "Create a QR code",
    subtitle: "Point a QR code at any website. Every scan is tracked through its short link.",
    button: "Generate QR code",
    back: "/dashboard/qr-codes",
    backLabel: "Back to QR codes",
  },
};

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-400 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-neutral-400";

function todayInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CreateLinkForm({ variant, initialUrl = "" }: { variant: Variant; initialUrl?: string }) {
  const copy = COPY[variant];
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState("");
  const [alias, setAlias] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [expires, setExpires] = useState("");
  const { prefs } = usePrefs();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<LinkItem | null>(null);

  function reset() {
    setUrl("");
    setTitle("");
    setAlias("");
    setTags([]);
    setExpires("");
    setError(null);
    setCreated(null);
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) return setError("Please paste a destination URL");
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    let expiresAt: string | undefined;
    if (expires) {
      const d = new Date(`${expires}T23:59:59`);
      if (d.getTime() <= Date.now()) return setError("Expiry date must be in the future");
      expiresAt = d.toISOString();
    } else {
      // Settings → Preferences → default expiry for new links
      expiresAt = expiryFromPrefs(prefs);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_url: withProtocol,
          short_code: alias.trim() || undefined,
          title: title.trim() || undefined,
          tags: tags.length ? tags : undefined,
          expires_at: expiresAt,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.error ?? "Something went wrong");
      setCreated(json.data as LinkItem);
      if (prefs.autoCopy && json.data?.short_code) {
        navigator.clipboard.writeText(getShortUrl(json.data.short_code)).catch(() => undefined);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const domain = getBaseUrl().replace(/^https?:\/\//, "");
  const previewHost = url.trim() ? hostnameOf(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`) : "";

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href={copy.back}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <FiArrowLeft size={14} /> {copy.backLabel}
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          {created ? (variant === "qr" ? "Your QR code is ready" : "Your link is ready") : copy.title}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">{created ? "Copy it, share it, or download the QR code." : copy.subtitle}</p>
      </div>

      {created ? (
        <SuccessPanel link={created} variant={variant} onReset={reset} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Form */}
          <form
            onSubmit={handleCreate}
            className="lg:col-span-3 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] space-y-5"
          >
            <FormField label="Destination URL" icon={FiLink}>
              <input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/my-long-url"
                className={inputCls}
              />
            </FormField>

            <FormField label="Title" icon={FiType} hint="(optional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder={variant === "qr" ? "e.g. Restaurant menu" : "e.g. Summer campaign"}
                className={inputCls}
              />
            </FormField>

            <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
              <p className="text-sm font-semibold text-neutral-900">
                {variant === "qr" ? "Short link (used inside the QR)" : "Customise your link"}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Domain" icon={FiGlobe}>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-600">
                    {domain}
                    <span className="text-[10px] font-semibold uppercase text-neutral-400">Default</span>
                  </div>
                </FormField>
                <FormField label="Custom back-half" icon={FiHash} hint="(optional)">
                  <input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.replace(/\s/g, "-"))}
                    maxLength={30}
                    placeholder="my-link"
                    className={inputCls}
                  />
                </FormField>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField label="Tags" icon={FiTag} hint="(optional)">
                <TagInput value={tags} onChange={setTags} />
              </FormField>
              <FormField label="Expires on" icon={FiCalendar} hint="(optional)">
                <input
                  type="date"
                  value={expires}
                  min={todayInput()}
                  onChange={(e) => setExpires(e.target.value)}
                  className={`${inputCls} py-2`}
                />
                {!expires && prefs.defaultExpiryDays && (
                  <span className="mt-1 block text-[11px] text-neutral-500">
                    Default: expires after {expiryLabel(prefs.defaultExpiryDays)} ·{" "}
                    <Link href="/dashboard/settings?tab=preferences" className="font-semibold hover:text-brand">
                      change
                    </Link>
                  </span>
                )}
              </FormField>
            </div>

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg btn-primary active:scale-[0.99] text-white text-sm font-semibold py-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner className="size-4" /> Creating...
                </>
              ) : (
                <>
                  {copy.button} <FiArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Live preview */}
          <aside className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-4">Preview</p>
              {variant === "qr" ? (
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center text-neutral-400">
                    <TbQrcode size={56} />
                    <span className="text-[11px] mt-1">Generated on create</span>
                  </div>
                  <p className="mt-4 text-base font-bold text-neutral-900 text-center truncate max-w-full">
                    {title || previewHost || "Your QR code"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate max-w-full">{url || "https://..."}</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <span className="w-10 h-10 shrink-0 rounded-full border border-neutral-200 bg-white flex items-center justify-center overflow-hidden">
                    {previewHost ? (
                      <img
                        src={faviconFor({ favicon_url: null, original_url: `https://${previewHost}` })}
                        alt=""
                        width={22}
                        height={22}
                      />
                    ) : (
                      <FiGlobe className="text-neutral-400" />
                    )}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[17px] font-bold text-neutral-900 truncate">{title || previewHost || "Untitled link"}</p>
                    <p className="text-sm font-semibold text-blue-600 truncate">
                      {domain}/{alias || "xxxxxxx"}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-neutral-700 min-w-0">
                      <FiCornerDownRight size={14} className="shrink-0 text-neutral-500" />
                      <span className="truncate">{url || "https://..."}</span>
                    </p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tags.map((t) => (
                          <span key={t} className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-5">
              <p className="text-sm font-semibold text-neutral-900 mb-3">Included with every {variant === "qr" ? "QR code" : "link"}</p>
              <ul className="space-y-2.5 text-sm text-neutral-600">
                {(variant === "qr"
                  ? ["Scan tracking with location & device", "High-resolution PNG download", "Change tags & expiry anytime"]
                  : ["Auto-generated QR code", "Click analytics with location & device", "Tags, expiry and enable / disable"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <FiCheckCircle size={15} className="text-emerald-600 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function SuccessPanel({ link, variant, onReset }: { link: LinkItem; variant: Variant; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const full = getShortUrl(link.short_code);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            <FiCheckCircle size={13} /> Created successfully
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Short link</p>
            <div className="flex items-center gap-2">
              <a href={full} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-blue-600 hover:underline truncate">
                {getShortUrlDisplay(link.short_code)}
              </a>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(full);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="flex items-center gap-1.5 shrink-0 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700"
              >
                {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-neutral-600 mt-1 min-w-0">
              <FiCornerDownRight size={14} className="shrink-0" />
              <span className="truncate">{link.original_url}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => shareUrl(full, link.title ?? full)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700"
            >
              <FiShare2 size={14} /> Share
            </button>
            <Link
              href={`/dashboard/analytics?link=${link.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700"
            >
              <FiBarChart2 size={14} /> Analytics
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center md:border-l md:border-neutral-100 md:pl-6">
          <div className="w-44 h-44 rounded-2xl border border-neutral-200 p-2 bg-white flex items-center justify-center">
            {link.qr_code_url ? (
              <img src={link.qr_code_url} alt="QR code" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-neutral-400 text-center">QR code unavailable</span>
            )}
          </div>
          <button
            disabled={!link.qr_code_url || busy}
            onClick={async () => {
              if (!link.qr_code_url) return;
              setBusy(true);
              try {
                await downloadQr(link.qr_code_url, link.short_code);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg btn-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? <Spinner className="size-4" /> : <FiDownload size={14} />} Download PNG
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-5 border-t border-neutral-100">
        <button
          onClick={onReset}
          className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-sm font-semibold text-neutral-700"
        >
          Create another
        </button>
        <Link
          href={variant === "qr" ? "/dashboard/qr-codes" : "/dashboard/links"}
          className="flex-1 text-center px-4 py-2.5 rounded-lg btn-primary text-sm font-semibold text-white"
        >
          {variant === "qr" ? "View all QR codes" : "View all links"}
        </Link>
      </div>
    </div>
  );
}
