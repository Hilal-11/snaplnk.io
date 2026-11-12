import type { Metadata } from "next";

// Applies to /admin and /admin/login: never indexed. Access control lives in
// proxy.ts, app/admin/(panel)/layout.tsx (requireAdmin) and every admin API/action.
export const metadata: Metadata = {
  title: { default: "Admin · Snaplnk", template: "%s · Snaplnk Admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
