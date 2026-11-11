"use client";

import Link from "next/link";
import { useState } from "react";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCopy,
  FiCornerDownRight,
  FiDownload,
  FiEdit2,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiInfo,
  FiLink2,
  FiLock,
  FiPause,
  FiPlay,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import LinkActionsMenu, { type MenuItem } from "./LinkActionsMenu";
import { InlineTags } from "./TagInput";
import StatusBadge from "./StatusBadge";
import type { CardVariant, LinkItem, ViewMode } from "./types";
import { displayTitle, downloadQr, faviconFor, formatDate, getLinkStatus, shareUrl } from "./utils";

export interface LinkCardHandlers {
  onEdit: (link: LinkItem) => void;
  onDetails: (link: LinkItem) => void;
  onViewQr: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
  onToggleHidden: (link: LinkItem) => void;
  onToggleActive: (link: LinkItem) => void;
  onTagsChange: (link: LinkItem, tags: string[]) => void;
  onTagClick: (tag: string) => void;
}

/* Icon-only button with a small hover tooltip. */
function IconAction({
  label,
  onClick,
  href,
  children,
  small,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  const cls = `${small ? "w-8 h-8" : "w-9 h-9"} flex items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 transition-[background-color,color,transform] duration-150 hover:-translate-y-px active:translate-y-0 active:scale-90 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110`;
  const tip = (
    <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 translate-y-1 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 scale-95 group-hover/act:opacity-100 group-hover/act:translate-y-0 group-hover/act:scale-100 transition-all duration-150 delay-150 group-hover/act:delay-300 z-20 shadow-lg">
      {label}
    </span>
  );
  return (
    <span className="relative group/act">
      {href ? (
        <Link href={href} aria-label={label} className={cls}>
          {children}
        </Link>
      ) : (
        <button onClick={onClick} aria-label={label} className={cls}>
          {children}
        </button>
      )}
      {tip}
    </span>
  );
}

function Favicon({ link, size = 40 }: { link: LinkItem; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="shrink-0 rounded-full border border-neutral-200 bg-white flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <FiGlobe className="text-neutral-400" size={size * 0.42} />
      ) : (
        <img
          src={faviconFor(link)}
          alt=""
          width={size * 0.55}
          height={size * 0.55}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export default function LinkCard({
  link,
  variant,
  view,
  selected,
  onSelect,
  handlers,
}: {
  link: LinkItem;
  variant: CardVariant;
  view: ViewMode;
  selected: boolean;
  onSelect: (id: string) => void;
  handlers: LinkCardHandlers;
}) {
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const fullUrl = getShortUrl(link.short_code);
  const shortDisplay = getShortUrlDisplay(link.short_code);
  const isList = view === "list";
  const compact = view === "grid4";
  const status = getLinkStatus(link);

  async function copy() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    const r = await shareUrl(fullUrl, displayTitle(link));
    if (r === "copied") {
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 1500);
    }
  }

  const menuItems: MenuItem[] = [
    { label: "View link details", icon: FiInfo, onClick: () => handlers.onDetails(link) },
    variant === "link"
      ? { label: "View QR code", icon: TbQrcode, onClick: () => handlers.onViewQr(link), disabled: !link.qr_code_url }
      : { label: "Share", icon: FiShare2, onClick: share },
    { label: "Copy short link", icon: FiCopy, onClick: copy },
    { label: "Open destination", icon: FiExternalLink, onClick: () => window.open(link.original_url, "_blank", "noopener") },
    ...(variant === "link"
      ? [{
          label: "Download QR",
          icon: FiDownload,
          onClick: () => link.qr_code_url && downloadQr(link.qr_code_url, link.short_code),
          disabled: !link.qr_code_url,
        }]
      : []),
    {
      label: link.is_active ? "Disable link" : "Enable link",
      icon: link.is_active ? FiPause : FiPlay,
      onClick: () => handlers.onToggleActive(link),
      separated: true,
    },
    {
      label: link.archived_link ? "Unhide" : "Hide",
      icon: link.archived_link ? FiEye : FiEyeOff,
      onClick: () => handlers.onToggleHidden(link),
    },
    { label: "Delete", icon: FiTrash2, onClick: () => handlers.onDelete(link), danger: true, separated: true },
  ];

  /* ---------- action buttons (right side) ---------- */
  const actions = (
    <div className="flex items-center gap-0.5 shrink-0">
      <IconAction small={compact} label="Edit" onClick={() => handlers.onEdit(link)}>
        <FiEdit2 size={15} />
      </IconAction>
      {variant === "link" ? (
        <IconAction small={compact} label={shareMsg ? "Copied!" : "Share"} onClick={share}>
          {shareMsg ? <FiCheck size={15} className="text-emerald-600" /> : <FiShare2 size={15} />}
        </IconAction>
      ) : (
        <IconAction
          small={compact}
          label="Download"
          onClick={() => link.qr_code_url && downloadQr(link.qr_code_url, link.short_code)}
        >
          <FiDownload size={15} />
        </IconAction>
      )}
      <IconAction small={compact} label="Analytics" href={`/dashboard/analytics?link=${link.id}`}>
        <FiBarChart2 size={15} />
      </IconAction>
      <LinkActionsMenu items={menuItems} size={compact ? "sm" : "md"} />
    </div>
  );

  const checkbox = (
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onSelect(link.id)}
      aria-label={`Select ${displayTitle(link)}`}
      className="mt-1 w-4 h-4 shrink-0 rounded border-neutral-300 accent-[var(--brand)] cursor-pointer transition-transform active:scale-90"
    />
  );

  /* ---------- visual (favicon or QR) ---------- */
  const qrSize = isList ? 96 : compact ? 120 : 140;
  const visual =
    variant === "qr" ? (
      <button
        onClick={() => handlers.onViewQr(link)}
        className="shrink-0 rounded-xl border border-neutral-200 bg-white p-1.5 hover:border-neutral-400 transition-colors"
        style={{ width: qrSize, height: qrSize }}
        aria-label="View QR code"
      >
        {link.qr_code_url ? (
          <img src={link.qr_code_url} alt={`QR for ${link.short_code}`} className="w-full h-full object-contain" />
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            <TbQrcode size={32} className="text-neutral-300" />
          </span>
        )}
      </button>
    ) : (
      <Favicon link={link} size={compact ? 34 : 40} />
    );

  /* ---------- text body ---------- */
  const shortLinkRow = (
    <div className="flex items-center gap-1.5 min-w-0">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-blue-600 hover:underline truncate"
      >
        {shortDisplay}
      </a>
      <button
        onClick={copy}
        aria-label="Copy short link"
        title="Copy"
        className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
      >
        {copied ? <FiCheck size={14} className="text-emerald-600" /> : <FiCopy size={14} />}
      </button>
      {link.is_password_protected && <FiLock size={12} className="text-neutral-400 shrink-0" />}
    </div>
  );

  const destRow = (
    <div className="flex items-center gap-1.5 min-w-0 text-sm text-neutral-800">
      <FiCornerDownRight size={14} className="shrink-0 text-neutral-500" />
      <a
        href={link.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate hover:underline"
        title={link.original_url}
      >
        {link.original_url}
      </a>
    </div>
  );

  const metaRow = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-600">
      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 font-semibold text-neutral-800">
        <FiBarChart2 size={12} />
        {link.clicks_count.toLocaleString()} {link.clicks_count === 1 ? "click" : "clicks"}
      </span>
      <span className="inline-flex items-center gap-1.5" title={`Created ${formatDate(link.created_at)}`}>
        <FiCalendar size={13} className="text-neutral-500" />
        {formatDate(link.created_at)}
      </span>
      {variant === "qr" && !compact && (
        <span className="inline-flex items-center gap-1 min-w-0">
          <FiLink2 size={13} className="text-neutral-500 shrink-0" />
          <span className="truncate">{shortDisplay}</span>
        </span>
      )}
      {status !== "active" && <StatusBadge link={link} />}
      <InlineTags
        tags={link.tags ?? []}
        compact={compact}
        onChange={(tags) => handlers.onTagsChange(link, tags)}
        onTagClick={handlers.onTagClick}
      />
    </div>
  );

  const titleEl = (
    <button
      onClick={() => handlers.onDetails(link)}
      className={`text-left font-bold text-neutral-900 hover:underline decoration-brand decoration-2 underline-offset-4 truncate max-w-full ${
        compact ? "text-[15px]" : "text-[17px]"
      }`}
    >
      {displayTitle(link)}
    </button>
  );

  const cardBase = `group relative bg-white rounded-xl border transition-all ${
    selected
      ? "border-brand ring-2 ring-brand/25 bg-brand-soft/30"
      : "border-neutral-200/80 hover:border-neutral-300 hover:shadow-[0px_10px_28px_-14px_rgba(0,0,0,0.22)]"
  } ${status === "hidden" || status === "disabled" ? "opacity-80" : ""}`;

  if (isList) {
    return (
      <div className={`${cardBase} p-5`}>
        <div className="flex gap-4">
          {checkbox}
          {visual}
          <div className="flex-1 min-w-0 space-y-2">
            {variant === "qr" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                <FiGlobe size={12} /> Website
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                {titleEl}
                {variant === "link" && shortLinkRow}
                {destRow}
              </div>
              <div className="hidden sm:block">{actions}</div>
            </div>
            <div className="pt-1">{metaRow}</div>
            <div className="sm:hidden pt-1 border-t border-neutral-100">{actions}</div>
          </div>
        </div>
      </div>
    );
  }

  /* grid layouts */
  return (
    <div className={`${cardBase} ${compact ? "p-4" : "p-5"} flex flex-col h-full`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {checkbox}
          {variant === "link" && visual}
        </div>
        {actions}
      </div>
      {variant === "qr" && <div className="flex justify-center my-3">{visual}</div>}
      <div className={`min-w-0 space-y-1 ${variant === "link" ? "mt-3" : ""}`}>
        {variant === "qr" && (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 mb-1">
            <FiGlobe size={11} /> Website
          </span>
        )}
        {titleEl}
        {shortLinkRow}
        {destRow}
      </div>
      <div className="mt-auto pt-3">
        <div className="pt-3 border-t border-neutral-100">{metaRow}</div>
      </div>
    </div>
  );
}
