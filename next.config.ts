import type { NextConfig } from "next";

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// Admin pages: no framing, no caching, no indexing, and a CSP that blocks plugins,
// foreign <base> tags and cross-site form posts. Scripts/styles stay same-origin
// ('unsafe-inline' is required by Next's inline bootstrap and our inline styles).
const adminCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://github.com " + (process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.62.159.32'],

  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      {
        // Not framable by other sites — except public bio pages (embeddable) and /admin
        // (which gets the stricter DENY below; two X-Frame-Options values would cancel out).
        source: "/((?!bio/|@|admin).*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/admin/:path*", // also matches /admin itself
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: adminCsp },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      // Public bio pages live at /@username, but a folder named "@x" is a
      // parallel-route slot in the App Router, so the real route is /bio/[username].
      // beforeFiles: must win over the app/[shortCode] dynamic route.
      beforeFiles: [
        { source: "/@:username", destination: "/bio/:username" },
        { source: "/@:username/:path*", destination: "/bio/:username/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
