import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export default async function DashboardGreeting() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user?.id)
    .maybeSingle();

  const name = profile?.name?.split(" ")[0] || "there";
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