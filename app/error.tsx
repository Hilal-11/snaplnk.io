"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

// React error boundary for every route segment: reports to ErrorLog, then offers a retry.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track("client_error", {
      message: error.message.slice(0, 500),
      stack: (error.stack ?? "").slice(0, 2000),
      digest: error.digest ?? null,
      kind: "boundary",
    });
  }, [error]);

  return (
    <div className="relative isolate flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center font-sans">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
      <p className="text-sm font-semibold text-brand">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">This page hit an unexpected error</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">It&apos;s been reported automatically. Try again, or head back home.</p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="rounded-lg btn-primary px-4 py-2 text-sm font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
          Go home
        </Link>
      </div>
    </div>
  );
}
