"use client"
import { useState } from "react";
import { FiCopy, FiCheck, FiDownload, FiShare2 } from "react-icons/fi";

export default function RecentLinkActions({
  shortUrl,
  originalUrl,
  qrCodeUrl,
  title,
}: {
  shortUrl: string;
  originalUrl: string;
  qrCodeUrl: string | null;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadQr() {
    if (!qrCodeUrl) return;
    const res = await fetch(qrCodeUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${shortUrl.replace(/^https?:\/\//, "").replace(/\//g, "-")}-qr.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shortUrl });
      } catch {
        // user cancelled the native share sheet — no action needed
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex items-center justify-end gap-1 mt-1 pl-12">
      <ActionButton onClick={handleCopy} title="Copy link">
        {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
      </ActionButton>

      {qrCodeUrl && (
        <ActionButton onClick={handleDownloadQr} title="Download QR code">
          <FiDownload />
        </ActionButton>
      )}

      <ActionButton onClick={handleShare} title="Share">
        <FiShare2 />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 rounded-sm border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 active:scale-[0.97] transition-all duration-150 text-sm"
    >
      {children}
    </button>
  );
}