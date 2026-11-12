import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { displayNameOf } from "@/lib/prefs";

export default async function DashboardGreeting() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user?.id)
    .maybeSingle();

  // Name set in Settings → Profile wins, then the users table, then the email.
  const meta = user?.user_metadata ?? {};
  const fromSettings = typeof meta.name === "string" && meta.name.trim() ? meta.name : "";
  const full = fromSettings || profile?.name || displayNameOf(user);
  const name = full.trim().split(" ")[0] || "there";
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
        Welcome back, {name}
      </h1>
      <p className="text-sm text-neutral-400 mt-1">{today}</p>
    </div>
  );
}