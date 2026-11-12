"use client";

import { useTransition } from "react";
import { FiCheck, FiRotateCcw } from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import { setErrorResolved } from "@/app/admin/(panel)/errors/actions";

export default function ResolveButton({ fingerprint, resolved }: { fingerprint: string; resolved: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => void (await setErrorResolved({ fingerprint, resolved: !resolved })))}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
    >
      {pending ? <Spinner className="size-3.5" /> : resolved ? <FiRotateCcw size={12} /> : <FiCheck size={12} />}
      {resolved ? "Reopen" : "Mark resolved"}
    </button>
  );
}
