"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { track } from "@/lib/analytics/client";

const VITALS = new Set(["LCP", "INP", "CLS", "TTFB", "FCP"]);

/**
 * Mounted once in the root layout (inside <Suspense>, since it reads search params):
 * page views on every route change, uncaught errors, and Core Web Vitals.
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();

  useEffect(() => {
    track("page_view");
  }, [pathname, query]);

  useEffect(() => {
    const onError = (e: ErrorEvent) =>
      track("client_error", {
        message: String(e.message || "Script error").slice(0, 500),
        stack: e.error instanceof Error ? (e.error.stack ?? "").slice(0, 2000) : null,
        kind: "error",
      });
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: unknown = e.reason;
      track("client_error", {
        message: (r instanceof Error ? r.message : String(r)).slice(0, 500),
        stack: r instanceof Error ? (r.stack ?? "").slice(0, 2000) : null,
        kind: "unhandledrejection",
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useReportWebVitals((metric) => {
    if (!VITALS.has(metric.name)) return;
    track("web_vital", {
      metric: metric.name,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      rating: metric.rating ?? null,
    });
  });

  return null;
}
