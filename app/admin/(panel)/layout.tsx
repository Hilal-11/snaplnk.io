import { requireAdmin } from "@/lib/admin/requireAdmin";
import AdminShell from "@/components/admin/AdminShell";

// Layer 2 of 3 (after proxy.ts): every admin page re-checks admin access on the server.
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email ?? ""}>{children}</AdminShell>;
}
