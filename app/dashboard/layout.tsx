// app/dashboard/layout.tsx
import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests (anonymous users) have a session but are NOT logged in
  if (!user || user.is_anonymous) {
    redirect("/signup?next=/dashboard");
  }

  return <DashboardShell>{children}</DashboardShell>;
}