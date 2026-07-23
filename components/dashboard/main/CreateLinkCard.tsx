"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Copy,
  Check,
  Link2,
  Tag,
  CalendarDays,
  Type,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";

interface CreateLinkCardProps {
  baseUrl?: string; // falls back to NEXT_PUBLIC_BASE_URL
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreateLinkCard({ baseUrl }: CreateLinkCardProps) {
  const resolvedBaseUrl = baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";

  // core field
  const [url, setUrl] = useState("");

  // optional fields
  const [showOptions, setShowOptions] = useState(true);
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [expiresOn, setExpiresOn] = useState<Date | undefined>(undefined);

  // request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function addTag() {
    const value = tagInput.trim().replace(/,$/, "");
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function resetForm() {
    setUrl("");
    setAlias("");
    setTitle("");
    setTags([]);
    setTagInput("");
    setExpiresOn(undefined);
    setShortUrl(null);
    setError(null);
    setCopied(false);
  }

  async function handleCreate() {
    setError(null);
    setShortUrl(null);
    setCopied(false);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return setError("Please paste a URL first");

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { original_url: trimmedUrl };
      if (alias.trim()) payload.custom_alias = alias.trim();
      if (title.trim()) payload.title = title.trim();
      if (tags.length) payload.tags = tags;
      if (expiresOn) payload.expires_on = expiresOn.toISOString();

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) return setError(json.error ?? "Something went wrong");

      setShortUrl(`${resolvedBaseUrl}/${json.data.short_code}`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  const optionsFilledCount = [alias, title].filter(Boolean).length + (tags.length ? 1 : 0);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: 75% — URL input + options */}
        <div className="lg:col-span-4 flex flex-col">
          <p className="text-sm font-semibold text-neutral-900 mb-3">Create a short link</p>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-neutral-200 rounded-lg bg-neutral-50 focus-within:border-neutral-400 focus-within:bg-white transition-colors">
              <span className="pl-3 pr-1 flex items-center text-neutral-400">
                <Image src="/snaplinklogolight.svg" width={18} height={18} alt="" />
              </span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleCreate()}
                placeholder="Paste your long URL"
                className="flex-1 bg-transparent py-2.5 pr-3 text-sm font-medium outline-none min-w-0"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span className="hidden xl:inline">Shorten</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Options toggle */}
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            className="mt-2.5 flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors self-start"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showOptions ? "rotate-180" : ""}`}
            />
            Options
            {optionsFilledCount > 0 && !showOptions && (
              <span className="ml-0.5 rounded-full bg-neutral-900 text-white text-[10px] font-semibold px-1.5 py-[1px]">
                {optionsFilledCount}
              </span>
            )}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </button>

          {/* Options panel */}
          <div
            className={`grid transition-all duration-200 ease-out ${
              showOptions ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
                {/* Custom alias */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 mb-1">
                    <Link2 className="h-3 w-3" />
                    Custom alias
                  </label>
                  <div className="flex items-center border border-neutral-200 rounded-md bg-white focus-within:border-neutral-400 transition-colors overflow-hidden">
                    {resolvedBaseUrl && (
                      <span className="pl-2.5 text-xs text-neutral-400 truncate max-w-[40%]">
                        {resolvedBaseUrl.replace(/^https?:\/\//, "")}/
                      </span>
                    )}
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.replace(/\s/g, "-"))}
                      placeholder="my-link"
                      className="flex-1 min-w-0 bg-transparent py-3 px-2 text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 mb-1">
                    <Type className="h-3 w-3" />
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this link a name"
                    className="w-full border border-neutral-200 rounded-md bg-white py-3 px-2.5 text-xs font-medium outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>

                {/* Tags */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 mb-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-1 border border-neutral-200 rounded-md bg-white py-1.5 px-2 focus-within:border-neutral-400 transition-colors">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded bg-neutral-100 text-neutral-700 text-[11px] font-medium pl-1.5 pr-1 py-0.5"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-neutral-900"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTag}
                      placeholder={tags.length ? "" : "marketing, launch..."}
                      className="flex-1 min-w-[60px] bg-transparent py-2 text-xs font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}

          {/* Result */}
          {shortUrl && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline truncate"
              >
                {shortUrl}
              </a>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600 text-xs font-medium px-2 py-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-600 text-xs font-medium px-2 py-1.5 transition-colors"
                >
                  New
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: 25% — expiry calendar */}
        <div className="lg:col-span-1 lg:border-l lg:border-neutral-200 lg:pl-5">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
              <CalendarDays className="h-3 w-3" />
              Expires on
            </label>
            {expiresOn && (
              <button
                type="button"
                onClick={() => setExpiresOn(undefined)}
                className="text-[11px] font-medium text-neutral-400 hover:text-neutral-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-1">
            <Calendar
              mode="single"
              selected={expiresOn}
              onSelect={setExpiresOn}
              disabled={{ before: new Date() }}
              className="w-full"
            />
          </div>

          <p className="mt-2 text-[11px] text-neutral-400 leading-relaxed">
            {expiresOn
              ? `Link expires ${formatDate(expiresOn)}`
              : "No expiry — link stays active until you delete it."}
          </p>
        </div>
      </div>
    </div>
  );
} 
