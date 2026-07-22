"use client";

import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import Image from "next/image";

export default function CreateLinkCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setShortUrl(null);
    if (!url.trim()) return setError("Please paste a URL first");

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) return setError(json.error ?? "Something went wrong");

      setShortUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/${json.data.short_code}`);
      setUrl("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] mb-6">
      <p className="text-sm font-semibold text-neutral-900 mb-3">Create a short link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center border border-neutral-200 rounded-lg bg-neutral-50 focus-within:border-neutral-400 transition-colors">
          <span className="pl-3 pr-1 flex items-center text-neutral-400">
            <Image src="/linkIcon.svg" width={18} height={18} alt="" />
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your long URL"
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm font-medium outline-none min-w-0"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 transition-all duration-150 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Shorten"}
          <FiArrowRight className="text-xs" />
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}

      {shortUrl && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
          
        <a href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline truncate"
          >
            {shortUrl}
          </a>
        </div>
      )}
    </div>
  );
}