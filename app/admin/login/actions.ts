"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/admin/ratelimit";
import { writeAudit } from "@/lib/admin/audit";
import { hashIp } from "@/lib/analytics/hash";
import { signInWithGithub, signInWithGoogle } from "@/app/auth/actions";

const COMPLETE = "/admin/login/complete";

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export type AdminLoginState = { error: string } | null;

/** Email + password admin sign-in (rate-limited per IP and per email). */
export async function adminPasswordSignIn(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const ip = await clientIp();
  const okIp = await rateLimit("adminLogin", `ip:${hashIp(ip) ?? "unknown"}`);
  const okEmail = await rateLimit("adminLogin", `email:${parsed.data.email}`);
  if (!okIp || !okEmail) {
    await writeAudit({ adminId: null, action: "admin.login_rate_limited", target: parsed.data.email, ip });
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    await writeAudit({
      adminId: null,
      action: "admin.login_denied",
      target: parsed.data.email,
      metadata: { reason: "bad_credentials" },
      ip,
    });
    return { error: "Invalid email or password." };
  }
  redirect(COMPLETE);
}

/** OAuth admin sign-in: same providers as the app, returning to the admin completion step. */
export async function adminOAuth(provider: "google" | "github"): Promise<void> {
  const ip = await clientIp();
  if (!(await rateLimit("adminLogin", `ip:${hashIp(ip) ?? "unknown"}`))) {
    await writeAudit({ adminId: null, action: "admin.login_rate_limited", metadata: { provider }, ip });
    redirect("/admin/login?error=rate");
  }
  if (provider === "google") await signInWithGoogle(COMPLETE);
  else await signInWithGithub(COMPLETE);
}
