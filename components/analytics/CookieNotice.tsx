"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { setTrackingOptOut } from "@/lib/analytics/client";

const SEEN_KEY = "snl_cookie_notice";
const noop = () => () => {};
const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

/** First-visit notice for our first-party, cookie-light analytics (no ads, no third parties). */
export default function CookieNotice() {
  const pathname = usePathname();
  const seen = useSyncExternalStore(noop, readSeen, () => true);
  const [closed, setClosed] = useState(false);
  if (seen || closed || pathname.startsWith("/admin") || pathname.startsWith("/bio/")) return null;

  function close(optOut: boolean) {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setTrackingOptOut(optOut);
    setClosed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        role="region"
        aria-label="Privacy notice"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-4 font-sans shadow-[0_16px_40px_-12px_rgba(0,0,0,0.3)] sm:left-auto sm:right-6 sm:mx-0"
      >
        <p className="text-sm font-semibold text-neutral-900">We respect your privacy</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Snaplnk uses first-party, privacy-friendly analytics to improve the product — no ads, no third-party trackers, and
          IP addresses are never stored. We honour Do Not Track.{" "}
          <Link href="/privacy" className="font-semibold text-neutral-900 underline underline-offset-2">
            Privacy policy
          </Link>
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => close(true)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Opt out
          </button>
          <button onClick={() => close(false)} className="rounded-lg btn-primary px-3 py-1.5 text-xs font-semibold text-white">
            Got it
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
