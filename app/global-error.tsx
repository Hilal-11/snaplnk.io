"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

// Last-resort boundary (errors in the root layout). Must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track("client_error", {
      message: error.message.slice(0, 500),
      stack: (error.stack ?? "").slice(0, 2000),
      digest: error.digest ?? null,
      kind: "global",
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#666", fontSize: 14 }}>The error has been reported.</p>
          <button
            onClick={reset}
            style={{ marginTop: 12, padding: "8px 16px", borderRadius: 6, border: 0, background: "#111", color: "#fff", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
