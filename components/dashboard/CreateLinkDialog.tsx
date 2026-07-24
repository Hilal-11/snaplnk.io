"use client";

import { getShortUrl } from "@/lib/utils/getShortUrl";
import { useState } from "react";
import {
  FiX,
  FiLink,
  FiCopy,
  FiCheck,
  FiDownload,
  FiShare2,
  FiTag,
  FiCalendar,
  FiLock,
  FiHash,
  FiGlobe,
  FiBarChart2,
} from "react-icons/fi";

interface CreatedLink {
  id: string;
  original_url: string;
  short_code: string;
  domain: string;
  qr_code_url: string;
  clicks_count: number;
  created_at: string;
}

export default function CreateLinkDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function reset() {
    setUrl("");
    setCustomAlias("");
    setTitle("");
    setTagsInput("");
    setExpiresAt("");
    setError(null);
    setCreated(null);
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    setError(null);
    if (!url.trim()) return setError("Please paste a URL first");

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_url: url.trim(),
          short_code: customAlias.trim() || undefined,
          title: title.trim() || undefined,
          tags: tagsInput
            ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined,
          expires_at: expiresAt || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      setCreated(json.data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const shortUrl = created ? getShortUrl(created.short_code) : "";

  function copyShortUrl() {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadQr() {
    if (!created?.qr_code_url) return;
    const res = await fetch(created.qr_code_url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${created.short_code}-qr.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || shortUrl, url: shortUrl });
      } catch {
        // cancelled — no-op
      }
    } else {
      copyShortUrl();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.25)]">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <p className="text-base font-semibold text-neutral-900">
            {created ? "Link created" : "Create a short link"}
          </p>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <FiX />
          </button>
        </div>

        <div className="p-6">
          {!created ? (
            <>
              {/* ---------- FORM STATE ---------- */}
              <div className="space-y-4">
                <Field label="Destination URL" icon={FiLink} required>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/your-long-link"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Custom alias" icon={FiHash}>
                    <input
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      placeholder="my-campaign"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </Field>
                  <Field label="Expires on" icon={FiCalendar}>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </Field>
                </div>

                <Field label="Title" icon={FiGlobe}>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this link a name (optional)"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                <Field label="Tags" icon={FiTag}>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="campaign, social, q3 (comma separated)"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </Field>

                <button
                  disabled
                  title="Coming soon"
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-400 cursor-not-allowed"
                >
                  <FiLock className="text-[13px]" />
                  Password protection — coming soon
                </button>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-sm font-semibold py-2.5 transition-all disabled:opacity-50"
              >
                {loading ? "Creating link..." : "Create short link"}
              </button>
            </>
          ) : (
            <>
              {/* ---------- SUCCESS STATE — three boxes ---------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 1 — link details */}
                <div className="rounded-xl border border-neutral-200 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                    Your short link
                  </p>
                  <div className="flex items-center gap-2">
                    
                    <a href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm font-medium text-blue-600 hover:underline truncate"
                    >
                      {shortUrl}
                    </a>
                    <button
                      onClick={copyShortUrl}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors flex-shrink-0"
                    >
                      {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-2">
                    → {created.original_url}
                  </p>
                </div>

                {/* Box 2 — QR code */}
                <div className="rounded-xl border border-neutral-200 p-4 flex flex-col items-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3 self-start">
                    QR code
                  </p>
                  {created.qr_code_url ? (
                    <img
                      src={created.qr_code_url}
                      alt="QR code"
                      className="w-32 h-32 rounded-lg border border-neutral-100"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                      Not available
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 w-full">
                    <button
                      onClick={downloadQr}
                      disabled={!created.qr_code_url}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors disabled:opacity-40"
                    >
                      <FiDownload className="text-[12px]" />
                      Download
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors"
                    >
                      <FiShare2 className="text-[12px]" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Box 3 — link stats / metadata */}
                <div className="rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                    Link details
                  </p>
                  <div className="space-y-2.5">
                    <DetailRow icon={FiBarChart2} label="Clicks" value={String(created.clicks_count)} />
                    <DetailRow
                      icon={FiCalendar}
                      label="Created"
                      value={new Date(created.created_at).toLocaleDateString()}
                    />
                    <DetailRow
                      icon={FiHash}
                      label="Short code"
                      value={created.short_code}
                    />
                    {tagsInput && (
                      <DetailRow icon={FiTag} label="Tags" value={tagsInput} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-sm font-semibold text-neutral-700 transition-colors"
                >
                  Create another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-black hover:bg-neutral-800 text-sm font-semibold text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  required,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-neutral-500 mb-1.5">
        <Icon className="text-[12px]" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2.5 bg-neutral-50 focus-within:border-neutral-400 transition-colors">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-neutral-400 text-xs">
        <Icon className="text-[12px]" />
        {label}
      </span>
      <span className="font-medium text-neutral-900 truncate max-w-[140px]">{value}</span>
    </div>
  );
}