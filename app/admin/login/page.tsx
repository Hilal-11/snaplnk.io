import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAdmin } from "@/lib/admin/requireAdmin";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

const MESSAGES: Record<string, string> = {
  denied: "Access denied. This account isn't an administrator — the attempt has been logged.",
  rate: "Too many sign-in attempts. Please wait 15 minutes and try again.",
  expired: "Your session expired. Please sign in again.",
  config: "Admin access isn't configured on this deployment (ADMIN_SESSION_SECRET / service-role key missing).",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { decision } = await checkAdmin();
  if (decision === "ok") redirect("/admin");

  const { error } = await searchParams;
  const message = typeof error === "string" ? MESSAGES[error] ?? null : null;
  const signedInNonAdmin = decision === "forbidden";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 font-sans">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
      <AdminLoginForm message={message ?? (signedInNonAdmin ? MESSAGES.denied : null)} />
    </main>
  );
}
