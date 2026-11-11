"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiHash,
  FiLink,
  FiLock,
  FiMousePointer,
  FiShare2,
  FiTag,
  FiType,
  FiUsers,
} from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import Modal, { PrimaryButton, SecondaryButton } from "./Modal";
import { TagInput } from "./TagInput";
import StatusBadge from "./StatusBadge";
import type { LinkItem, LinkPatch } from "./types";
import { displayTitle, downloadQr, formatDate, shareUrl, timeAgo } from "./utils";

/* ---------------- Confirm ---------------- */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            danger={danger}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Spinner className="size-4" />}
            {confirmLabel}
          </PrimaryButton>
        </>
      }
    >
      <div className="flex gap-3">
        <span
          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
            danger ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          <FiAlertTriangle size={18} />
        </span>
        <div>
          <p className="text-base font-semibold text-neutral-900">{title}</p>
          <div className="text-sm text-neutral-500 mt-1">{message}</div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Edit ---------------- */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function EditLinkDialog({
  link,
  onClose,
  onSave,
}: {
  link: LinkItem | null;
  onClose: () => void;
  onSave: (id: string, patch: LinkPatch) => Promise<boolean>;
}) {
  // Re-mount the form whenever a different link is opened, so state starts fresh.
  return (
    <Modal
      open={!!link}
      onClose={onClose}
      title="Edit link"
      description={link ? getShortUrlDisplay(link.short_code) : undefined}
    >
      {link && <EditLinkForm key={link.id} link={link} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function EditLinkForm({
  link,
  onClose,
  onSave,
}: {
  link: LinkItem;
  onClose: () => void;
  onSave: (id: string, patch: LinkPatch) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(link.title ?? "");
  const [tags, setTags] = useState<string[]>(link.tags ?? []);
  const [expires, setExpires] = useState(toDateInput(link.expires_at));
  const [isActive, setIsActive] = useState(link.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const patch: LinkPatch = { title: title.trim(), tags, isActive };
    if (expires) {
      const d = new Date(`${expires}T23:59:59`);
      if (d.getTime() <= Date.now()) return setError("Expiry date must be in the future");
      patch.expiresAt = d.toISOString();
    } else {
      patch.expiresAt = null;
    }
    setSaving(true);
    const ok = await onSave(link.id, patch);
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save changes. Please try again.");
  }

  return (
    <div className="space-y-4">
      <FormField label="Destination" icon={FiLink}>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-500">
          <span className="truncate">{link.original_url}</span>
          <FiLock size={12} className="shrink-0 ml-auto" />
        </div>
      </FormField>

      <FormField label="Title" icon={FiType}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Give this link a name"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-400 px-3 py-2.5 text-sm outline-none transition-colors"
        />
      </FormField>

      <FormField label="Tags" icon={FiTag}>
        <TagInput value={tags} onChange={setTags} />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Expires on" icon={FiCalendar}>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={expires}
              min={toDateInput(new Date().toISOString())}
              onChange={(e) => setExpires(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-400 px-3 py-2 text-sm outline-none transition-colors"
            />
            {expires && (
              <button
                type="button"
                onClick={() => setExpires("")}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
              >
                Clear
              </button>
            )}
          </div>
        </FormField>

        <FormField label="Status" icon={FiMousePointer}>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-neutral-700">
              {isActive ? "Active" : "Disabled"}
            </span>
            <span
              className={`relative w-9 h-5 rounded-full transition-colors ${
                isActive ? "bg-neutral-900" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  isActive ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </FormField>
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <SecondaryButton onClick={onClose} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving && <Spinner className="size-4" />}
          Save changes
        </PrimaryButton>
      </div>
    </div>
  );
}

export function FormField({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 mb-1.5">
        <Icon size={12} />
        {label}
        {hint && <span className="font-normal text-neutral-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ---------------- QR preview ---------------- */
export function QrPreviewDialog({ link, onClose }: { link: LinkItem | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={!!link} onClose={onClose} size="sm" title="QR code" description={link ? displayTitle(link) : undefined}>
      {link && (
        <div className="flex flex-col items-center">
          <div className="w-56 h-56 rounded-2xl border border-neutral-200 bg-white p-3 flex items-center justify-center">
            {link.qr_code_url ? (
              <img src={link.qr_code_url} alt={`QR code for ${link.short_code}`} className="w-full h-full object-contain" />
            ) : (
              <TbQrcode size={48} className="text-neutral-300" />
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-blue-600">{getShortUrlDisplay(link.short_code)}</p>
          <p className="text-xs text-neutral-400 truncate max-w-full">{link.original_url}</p>
          <div className="grid grid-cols-2 gap-2 w-full mt-5">
            <SecondaryButton
              className="flex items-center justify-center gap-1.5"
              onClick={() => shareUrl(getShortUrl(link.short_code), displayTitle(link))}
            >
              <FiShare2 size={14} /> Share
            </SecondaryButton>
            <PrimaryButton
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
            >
              {busy ? <Spinner className="size-4" /> : <FiDownload size={14} />} Download PNG
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Details ---------------- */
export function LinkDetailsDialog({ link, onClose }: { link: LinkItem | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal open={!!link} onClose={onClose} size="lg" title="Link details" description={link ? displayTitle(link) : undefined}>
      {link && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Short link</p>
                <div className="flex items-center gap-2">
                  <a
                    href={getShortUrl(link.short_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:underline truncate"
                  >
                    {getShortUrlDisplay(link.short_code)}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getShortUrl(link.short_code));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                    aria-label="Copy short link"
                  >
                    {copied ? <FiCheck size={13} className="text-emerald-600" /> : <FiCopy size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Destination</p>
                <a
                  href={link.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-700 hover:underline break-all inline-flex items-start gap-1"
                >
                  {link.original_url}
                  <FiExternalLink size={12} className="shrink-0 mt-1 text-neutral-400" />
                </a>
              </div>
              <StatusBadge link={link} />
            </div>
            {link.qr_code_url && (
              <img
                src={link.qr_code_url}
                alt="QR code"
                className="w-28 h-28 rounded-xl border border-neutral-200 p-1.5 self-start"
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Stat icon={FiBarChart2} label="Total clicks" value={link.clicks_count.toLocaleString()} />
            <Stat icon={FiUsers} label="Unique visitors" value={link.unique_clicks_count.toLocaleString()} />
            <Stat icon={FiClock} label="Last click" value={link.last_clicked_at ? timeAgo(link.last_clicked_at) : "—"} />
          </div>

          <dl className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 text-sm">
            <Row icon={FiCalendar} label="Created" value={formatDate(link.created_at)} />
            <Row icon={FiCalendar} label="Expires" value={link.expires_at ? formatDate(link.expires_at) : "Never"} />
            <Row icon={FiHash} label="Back-half" value={`${link.short_code}${link.is_custom_alias ? " (custom)" : ""}`} />
            <Row
              icon={FiMousePointer}
              label="Click limit"
              value={link.max_clicks ? `${link.clicks_count} / ${link.max_clicks}` : "Unlimited"}
            />
            <Row icon={FiLock} label="Password" value={link.is_password_protected ? "Protected" : "Off"} />
            <Row icon={FiTag} label="Tags" value={link.tags?.length ? link.tags.join(", ") : "No tags"} />
            {(link.utm_source || link.utm_medium || link.utm_campaign) && (
              <Row
                icon={FiLink}
                label="UTM"
                value={[link.utm_source, link.utm_medium, link.utm_campaign].filter(Boolean).join(" · ")}
              />
            )}
          </dl>
        </div>
      )}
    </Modal>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
      <Icon size={14} className="text-neutral-400 mb-1.5" />
      <p className="text-lg font-bold text-neutral-900 leading-none">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-1">{label}</p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="flex items-center gap-2 text-neutral-500 text-xs">
        <Icon size={12} />
        {label}
      </dt>
      <dd className="font-medium text-neutral-900 text-right truncate">{value}</dd>
    </div>
  );
}
