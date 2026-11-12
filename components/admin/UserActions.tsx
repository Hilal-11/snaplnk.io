"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FiAlertTriangle, FiSlash, FiTrash2, FiUnlock } from "react-icons/fi";
import Modal, { PrimaryButton, SecondaryButton } from "@/components/dashboard/links/Modal";
import { Spinner } from "@/components/ui/spinner";
import { banUser, deleteUser, unbanUser, type ActionResult } from "@/app/admin/(panel)/users/actions";

export default function UserActions({
  userId,
  email,
  banned,
  isAdmin,
  isSelf,
}: {
  userId: string;
  email: string | null;
  banned: boolean;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<"ban" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const confirmText = email ?? userId;

  function run(fn: () => Promise<ActionResult>, after?: (r: ActionResult) => void) {
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) {
        setModal(null);
        after?.(r);
        router.refresh();
      }
    });
  }

  if (isSelf || isAdmin) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        {isSelf ? "This is your account." : "Admin accounts can't be banned or deleted here — remove them from ADMIN_EMAILS first."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {banned ? (
          <SecondaryButton onClick={() => run(() => unbanUser({ userId }))} disabled={pending} className="flex items-center gap-1.5">
            {pending ? <Spinner className="size-4" /> : <FiUnlock size={14} />} Unban
          </SecondaryButton>
        ) : (
          <button
            onClick={() => {
              setResult(null);
              setModal("ban");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            <FiSlash size={14} /> Ban user
          </button>
        )}
        <button
          onClick={() => {
            setResult(null);
            setConfirm("");
            setModal("delete");
          }}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <FiTrash2 size={14} /> Delete user
        </button>
      </div>
      {result && !modal && (
        <p role="status" className={`text-xs font-medium ${result.ok ? "text-emerald-700" : "text-red-600"}`}>
          {result.ok ? result.message : result.error}
        </p>
      )}

      <Modal open={modal === "ban"} onClose={() => setModal(null)} size="sm" title="Ban this user?" description={confirmText}>
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">They&apos;ll be signed out everywhere and can&apos;t sign in again until unbanned. Their links keep working.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Reason (internal, optional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400" />
          </label>
          {result && !result.ok && <p className="text-xs text-red-600">{result.error}</p>}
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setModal(null)} disabled={pending}>
              Cancel
            </SecondaryButton>
            <PrimaryButton danger onClick={() => run(() => banUser({ userId, reason: reason || undefined }))} disabled={pending}>
              {pending && <Spinner className="size-4" />} Ban user
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal open={modal === "delete"} onClose={() => setModal(null)} size="sm" title="Delete this user permanently?" description={confirmText}>
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            <FiAlertTriangle className="mt-0.5 shrink-0" /> Removes the account, every link and its click history, QR images, bio pages and feedback. This can&apos;t be undone.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Type <span className="font-mono text-neutral-900">{confirmText}</span> to confirm
            </span>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} className="h-9 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-400" />
          </label>
          {result && !result.ok && <p className="text-xs text-red-600">{result.error}</p>}
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setModal(null)} disabled={pending}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              danger
              disabled={pending || confirm.trim().toLowerCase() !== confirmText.toLowerCase()}
              onClick={() => run(() => deleteUser({ userId, confirm }), () => router.push("/admin/users"))}
            >
              {pending && <Spinner className="size-4" />} Delete forever
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
