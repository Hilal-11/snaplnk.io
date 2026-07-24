"use client";
import { createClient } from "@/lib/supabase/client";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { useEffect, useState } from "react";
import {
  FiSearch,
  FiDownload,
  FiShare2,
  FiCopy,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiExternalLink,
  FiLink,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";

interface Link {
  id: string;
  short_code: string;
  domain: string;
  title: string | null;
  qr_code_url: string;
  created_at: string;
}

function QrCard({ link }: { link: Link }) {
  const [copied, setCopied] = useState(false);
  const shortUrl = getShortUrl(link.short_code);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: link.title ?? shortUrl, url: shortUrl });
      } else {
        await navigator.clipboard.writeText(shortUrl);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDownloadQR = async () => {
    if (!link.qr_code_url) return;
    try {
      const res = await fetch(link.qr_code_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${link.short_code}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("QR download failed:", err);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md hover:border-neutral-300 transition-all p-5 flex flex-col items-center">
      <div className="w-32 h-32 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 overflow-hidden">
        {link.qr_code_url ? (
          <img
            src={link.qr_code_url}
            alt={`QR for ${link.short_code}`}
            width={120}
            height={120}
            className="object-contain"
          />
        ) : (
          <TbQrcode size={40} className="text-neutral-300" />
        )}
      </div>

      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 truncate max-w-full text-center mb-3 flex items-center gap-1"
      >
        {shortUrl.replace("https://", "")}
        <FiExternalLink size={12} className="shrink-0 text-neutral-400" />
      </a>

      {link.title && (
        <p className="text-xs text-neutral-500 text-center truncate max-w-full mb-4">
          {link.title}
        </p>
      )}

      <div className="w-full flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadQR}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
            title="Download QR code"
          >
            <FiDownload size={15} />
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
            title="Share link"
          >
            <FiShare2 size={15} />
          </button>
          <button
            onClick={copyToClipboard}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
            title="Copy link"
          >
            {copied ? (
              <FiCheckCircle size={15} className="text-green-600" />
            ) : (
              <FiCopy size={15} />
            )}
          </button>
        </div>

        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
          title="Open link"
        >
          <FiArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}

export default function QrCodesPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("Please sign in to view your QR codes");
          return;
        }

        const { data, error: err } = await supabase
          .from("links")
          .select("id, short_code, domain, title, qr_code_url, created_at")
          .eq("owner", user.id)
          .eq("is_deleted", false)
          .not("qr_code_url", "is", null)
          .order("created_at", { ascending: false });

        if (err) throw err;
        setLinks(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load QR codes");
        console.error("Error fetching QR codes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const filteredLinks = links.filter((link) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      link.short_code.toLowerCase().includes(q) ||
      (link.title ?? "").toLowerCase().includes(q) ||
      `${getShortUrlDisplay(link.short_code)}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">
          QR Codes
        </h1>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-full max-w-sm flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2.5 shadow-sm">
            <FiSearch size={16} className="text-neutral-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search QR codes"
              className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-neutral-400">
              <FiBarChart2 size={28} />
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Loading QR codes...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
            <FiAlertCircle
              size={28}
              className="text-neutral-400 mx-auto mb-3"
            />
            <p className="text-neutral-700 font-semibold text-sm">{error}</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-14 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
              <TbQrcode size={22} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              {search ? "No QR codes found" : "No QR codes yet"}
            </h3>
            <p className="text-sm text-neutral-500">
              {search
                ? "Try a different search term."
                : "QR codes are automatically generated when you create a link."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredLinks.map((link) => (
              <QrCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
