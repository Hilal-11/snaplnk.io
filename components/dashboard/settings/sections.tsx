"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import {
  FiAlertTriangle,
  FiCheck,
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGithub,
  FiList,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiMoon,
  FiSun,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { BsGrid, BsGrid3X3Gap } from "react-icons/bs";
import { Spinner } from "@/components/ui/spinner";
import Modal, { PrimaryButton, SecondaryButton } from "@/components/dashboard/links/Modal";
import { ConfirmDialog } from "@/components/dashboard/links/LinkDialogs";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_LINK_COLUMNS } from "@/config/linkColumns";
import { getShortUrl } from "@/lib/utils/getShortUrl";
import { usePrefs } from "@/hooks/usePrefs";
import { EXPIRY_OPTIONS, displayNameOf, expiryLabel, initialsOf, type ExpiryDays } from "@/lib/prefs";
import { PASSWORD_MIN, exportFileName, isEmail, isStrongEnough, passwordChecks, toCsv } from "@/lib/account";
import {
  getDefaultView,
  getReduceMotion,
  resetPageViews,
  setDefaultView,
  setReduceMotion,
  subscribeDevicePrefs,
  type DeviceView,
} from "@/lib/devicePrefs";
import { Segmented, SettingRow, SettingsCard, StatusMessage, Toggle, inputCls, type Status } from "./ui";

export type SectionProps = { user: User; notify: (msg: string) => void };

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============================== Profile ============================== */

export function ProfileSection({ user, notify }: SectionProps) {
  const meta = user.user_metadata ?? {};
  const current = typeof meta.name === "string" ? meta.name : typeof meta.full_name === "string" ? meta.full_name : "";
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [copied, setCopied] = useState(false);
  const avatarUrl = typeof meta.avatar_url === "string" && /^https:\/\//.test(meta.avatar_url) ? meta.avatar_url : null;
  const shown = name.trim() || displayNameOf(user);
  const dirty = name.trim() !== current.trim();

  async function save() {
    const value = name.trim();
    if (value.length > 60) return setStatus({ kind: "error", message: "Name can be at most 60 characters." });
    setSaving(true);
    setStatus(null);
    const { error } = await createClient().auth.updateUser({ data: { name: value } });
    setSaving(false);
    if (error) return setStatus({ kind: "error", message: error.message });
    notify("Profile updated");
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Your profile"
        description="How you appear across Snaplnk — in the sidebar menu and the dashboard greeting."
        footer={
          <>
            <StatusMessage status={status} />
            <PrimaryButton onClick={save} disabled={saving || !dirty}>
              {saving && <Spinner className="size-4" />} Save changes
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full border border-neutral-200 object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full btn-primary text-xl font-semibold">
                {initialsOf(shown)}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-brand" />
          </div>
          <div className="flex-1">
            <label htmlFor="profile-name" className="mb-1.5 flex justify-between text-xs font-semibold text-neutral-500">
              Display name <span className="font-normal tabular-nums text-neutral-400">{name.length}/60</span>
            </label>
            <input
              id="profile-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && dirty && save()}
              placeholder={displayNameOf(user)}
              className={inputCls}
            />
            <p className="mt-1.5 text-[11px] text-neutral-400">
              {avatarUrl ? "Your photo comes from your connected Google/GitHub account." : "Your avatar uses your initials."}
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Account details">
        <SettingRow label="Email" hint="Used to sign in and for account notices.">
          <span className="flex items-center gap-2 text-sm text-neutral-700">
            {user.email}
            {user.email_confirmed_at && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Verified</span>
            )}
          </span>
        </SettingRow>
        <SettingRow label="Member since">
          <span className="text-sm text-neutral-700">{fmt(user.created_at)}</span>
        </SettingRow>
        <SettingRow label="User ID" hint="Share this with support if you need help.">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(user.id);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-xs text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
          >
            {user.id.slice(0, 8)}…{user.id.slice(-4)}
            {copied ? <FiCheck className="text-emerald-600" /> : <FiCopy />}
          </button>
        </SettingRow>
      </SettingsCard>
    </div>
  );
}

/* ============================== Account ============================== */

const PROVIDERS: Record<string, { label: string; icon: React.ReactNode }> = {
  email: { label: "Email & password", icon: <FiMail size={16} /> },
  google: { label: "Google", icon: <FcGoogle size={16} /> },
  github: { label: "GitHub", icon: <FiGithub size={16} /> },
};

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={72}
        className={`${inputCls} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-neutral-700"
      >
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
  );
}

export function AccountSection({ user, notify }: SectionProps) {
  const identities = user.identities ?? [];
  const hasPassword = identities.some((i) => i.provider === "email");

  // email
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<Status>(null);

  async function changeEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!isEmail(email)) return setEmailStatus({ kind: "error", message: "Enter a valid email address." });
    if (email === user.email) return setEmailStatus({ kind: "error", message: "That's already your email." });
    setEmailBusy(true);
    setEmailStatus(null);
    const next = encodeURIComponent("/dashboard/settings?tab=account");
    const { error } = await createClient().auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` }
    );
    setEmailBusy(false);
    if (error) return setEmailStatus({ kind: "error", message: error.message });
    setNewEmail("");
    setEmailStatus({ kind: "success", message: `Confirmation link sent. Your email changes once you confirm it.` });
  }

  // password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const checks = passwordChecks(newPw);
  const canSubmitPw =
    isStrongEnough(newPw) && newPw === confirmPw && (!hasPassword || currentPw.length > 0) && !pwBusy;

  async function changePassword() {
    if (!canSubmitPw) return;
    setPwBusy(true);
    setPwStatus(null);
    const supabase = createClient();
    if (hasPassword) {
      // Re-verify the current password before allowing a change.
      const { error } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: currentPw });
      if (error) {
        setPwBusy(false);
        return setPwStatus({ kind: "error", message: "Your current password is incorrect." });
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) return setPwStatus({ kind: "error", message: error.message });
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    notify(hasPassword ? "Password changed" : "Password set — you can now sign in with email too");
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Email address"
        description={
          <>
            Current: <span className="font-semibold text-neutral-700">{user.email}</span>
            {user.new_email && (
              <span className="ml-2 rounded-md bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">
                Pending: {user.new_email}
              </span>
            )}
          </>
        }
        footer={
          <>
            <StatusMessage status={emailStatus} />
            <PrimaryButton onClick={changeEmail} disabled={emailBusy || !newEmail.trim()}>
              {emailBusy && <Spinner className="size-4" />} Send confirmation
            </PrimaryButton>
          </>
        }
      >
        <label htmlFor="new-email" className="mb-1.5 block text-xs font-semibold text-neutral-500">
          New email
        </label>
        <input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputCls}
        />
        <p className="mt-1.5 text-[11px] text-neutral-400">We&apos;ll email a confirmation link. Nothing changes until you click it.</p>
      </SettingsCard>

      <SettingsCard
        title={hasPassword ? "Change password" : "Set a password"}
        description={
          hasPassword
            ? "Use a password you don't use anywhere else."
            : "You sign in with Google/GitHub. Add a password to also sign in with your email."
        }
        footer={
          <>
            <StatusMessage status={pwStatus} />
            <PrimaryButton onClick={changePassword} disabled={!canSubmitPw}>
              {pwBusy && <Spinner className="size-4" />} {hasPassword ? "Update password" : "Set password"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {hasPassword && (
            <div className="sm:col-span-2">
              <label htmlFor="pw-current" className="mb-1.5 block text-xs font-semibold text-neutral-500">
                Current password
              </label>
              <PasswordInput id="pw-current" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" autoComplete="current-password" />
            </div>
          )}
          <div>
            <label htmlFor="pw-new" className="mb-1.5 block text-xs font-semibold text-neutral-500">
              New password
            </label>
            <PasswordInput id="pw-new" value={newPw} onChange={setNewPw} placeholder={`${PASSWORD_MIN}+ characters`} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1.5 block text-xs font-semibold text-neutral-500">
              Confirm new password
            </label>
            <PasswordInput id="pw-confirm" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat it" autoComplete="new-password" />
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-live="polite">
          {checks.map((c) => (
            <li key={c.id} className={`flex items-center gap-1 text-[11px] ${c.ok ? "text-emerald-700" : "text-neutral-400"}`}>
              {c.ok ? <FiCheck size={11} /> : <FiX size={11} />} {c.label}
            </li>
          ))}
          {confirmPw && (
            <li className={`flex items-center gap-1 text-[11px] ${newPw === confirmPw ? "text-emerald-700" : "text-red-600"}`}>
              {newPw === confirmPw ? <FiCheck size={11} /> : <FiX size={11} />} Passwords match
            </li>
          )}
        </ul>
      </SettingsCard>

      <SettingsCard title="Sign-in methods" description="The ways you can sign in to this account.">
        {identities.length === 0 ? (
          <p className="text-sm text-neutral-500">No sign-in methods found.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {identities.map((i) => {
              const p = PROVIDERS[i.provider] ?? { label: i.provider, icon: <FiMail size={16} /> };
              const email = typeof i.identity_data?.email === "string" ? i.identity_data.email : null;
              return (
                <li key={i.identity_id ?? i.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700">
                    {p.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{p.label}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {email ?? "Connected"} · since {fmt(i.created_at)}
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">Connected</span>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}

/* ============================ Preferences ============================ */

export function PreferencesSection({ notify }: SectionProps) {
  const { prefs, loaded, save } = usePrefs();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function update(patch: Parameters<typeof save>[0], msg: string) {
    setBusy(true);
    setStatus(null);
    try {
      await save(patch);
      notify(msg);
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Couldn't save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="New links"
        description="Defaults applied when you create a short link or QR code. Saved to your account, on every device."
        footer={status ? <StatusMessage status={status} /> : undefined}
      >
        <SettingRow
          label="Default expiry"
          hint="New links stop redirecting after this. You can still pick a date per link."
        >
          <Segmented<ExpiryDays>
            label="Default expiry"
            layoutId="pref-expiry"
            value={prefs.defaultExpiryDays}
            disabled={!loaded || busy}
            options={EXPIRY_OPTIONS.map((d) => ({ value: d, label: expiryLabel(d) }))}
            onChange={(d) => update({ defaultExpiryDays: d }, `New links now expire: ${expiryLabel(d).toLowerCase()}`)}
          />
        </SettingRow>
        <SettingRow label="Copy new links automatically" hint="Puts the new short link on your clipboard right after creating it.">
          <Toggle
            label="Copy new links automatically"
            checked={prefs.autoCopy}
            disabled={!loaded || busy}
            onChange={(v) => update({ autoCopy: v }, v ? "Auto-copy on" : "Auto-copy off")}
          />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Shortcuts">
        <SettingRow label="Search & navigate" hint="Open the command palette from anywhere in the dashboard.">
          <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-semibold text-neutral-600">Ctrl / ⌘ + K</kbd>
        </SettingRow>
        <SettingRow label="Bio page editor" hint="Undo, redo and save while editing a bio page.">
          <span className="flex flex-wrap gap-1.5 text-xs text-neutral-600">
            {["⌘Z", "⇧⌘Z", "⌘S"].map((k) => (
              <kbd key={k} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-semibold">
                {k}
              </kbd>
            ))}
          </span>
        </SettingRow>
      </SettingsCard>
    </div>
  );
}

/* ============================= Appearance ============================ */

export function AppearanceSection({ notify }: SectionProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const reduce = useSyncExternalStore(subscribeDevicePrefs, getReduceMotion, () => false);
  const view = useSyncExternalStore(subscribeDevicePrefs, getDefaultView, () => "list" as DeviceView);
  const current = mounted ? theme ?? "system" : null;

  const themes = [
    { value: "light", label: "Light", icon: FiSun, bg: "#ffffff", fg: "#111111", panel: "#f4f4f5" },
    { value: "dark", label: "Dark", icon: FiMoon, bg: "#141416", fg: "#f5f5f5", panel: "#232327" },
    { value: "system", label: "System", icon: FiMonitor, bg: "linear-gradient(90deg,#ffffff 50%,#141416 50%)", fg: "#888", panel: "transparent" },
  ] as const;

  return (
    <div className="space-y-5">
      <SettingsCard title="Theme" description="Saved on this device. System follows your OS light/dark setting.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {themes.map((t) => {
            const active = current === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t.value);
                  notify(`${t.label} theme`);
                }}
                className={`group overflow-hidden rounded-xl border text-left transition-all hover-lift ${
                  active ? "border-brand ring-2 ring-brand/20" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="h-20 p-2.5" style={{ background: t.bg }}>
                  <div className="flex h-full gap-1.5">
                    <div className="w-1/4 rounded-md" style={{ background: t.panel, border: "1px solid rgb(127 127 127 / 0.2)" }} />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="h-2 w-2/3 rounded-full" style={{ background: t.fg, opacity: 0.8 }} />
                      <div className="h-2 w-1/2 rounded-full" style={{ background: t.fg, opacity: 0.35 }} />
                      <div className="mt-auto h-3 w-1/3 rounded-md bg-[oklch(0.665_0.215_41)]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                    <t.icon size={14} /> {t.label}
                  </span>
                  {active && <FiCheck className="text-brand" />}
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Display" description="Saved on this device.">
        <SettingRow label="Reduce motion" hint="Turns off page transitions, hover lifts and other animations.">
          <Toggle
            label="Reduce motion"
            checked={reduce}
            onChange={(v) => {
              setReduceMotion(v);
              notify(v ? "Animations reduced" : "Animations on");
            }}
          />
        </SettingRow>
        <SettingRow
          label="Default layout"
          hint="How Links, QR codes, Archived, Expired, Deleted and Tags are shown unless you pick a layout on that page."
        >
          <Segmented<DeviceView>
            label="Default layout"
            layoutId="pref-layout"
            value={view}
            options={[
              { value: "list", label: "List", icon: FiList },
              { value: "grid2", label: "2 col", icon: BsGrid },
              { value: "grid4", label: "4 col", icon: BsGrid3X3Gap },
            ]}
            onChange={(v) => {
              setDefaultView(v);
              notify("Default layout saved");
            }}
          />
        </SettingRow>
        <SettingRow label="Reset page layouts" hint="Forget layouts you picked on individual pages so the default applies everywhere.">
          <SecondaryButton
            onClick={() => {
              resetPageViews();
              notify("Page layouts reset");
            }}
          >
            Reset
          </SecondaryButton>
        </SettingRow>
      </SettingsCard>
    </div>
  );
}

/* ============================== Security ============================== */

export function SecuritySection({ user, notify }: SectionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [confirmGlobal, setConfirmGlobal] = useState(false);

  async function signOut(scope: "local" | "others" | "global") {
    setBusy(scope);
    setStatus(null);
    const { error } = await createClient().auth.signOut({ scope });
    setBusy(null);
    if (error) return setStatus({ kind: "error", message: error.message });
    if (scope === "others") return notify("Signed out of all other devices");
    router.replace("/signup");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <SettingsCard title="Sign-in activity">
        <SettingRow label="Last sign-in" hint="When this account last signed in.">
          <span className="text-sm text-neutral-700">{fmtTime(user.last_sign_in_at)}</span>
        </SettingRow>
        <SettingRow label="Email verified">
          <span className={`text-sm font-medium ${user.email_confirmed_at ? "text-emerald-700" : "text-orange-700"}`}>
            {user.email_confirmed_at ? `Yes · ${fmt(user.email_confirmed_at)}` : "Not yet"}
          </span>
        </SettingRow>
        <SettingRow label="Sign-in methods">
          <span className="text-sm text-neutral-700">{(user.identities ?? []).map((i) => PROVIDERS[i.provider]?.label ?? i.provider).join(", ") || "—"}</span>
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        title="Sessions"
        description="Lost a device or used a shared computer? End its session here."
        footer={status ? <StatusMessage status={status} /> : undefined}
      >
        <SettingRow label="Sign out of other devices" hint="Keeps you signed in here; everywhere else must sign in again.">
          <SecondaryButton onClick={() => signOut("others")} disabled={!!busy}>
            {busy === "others" ? <Spinner className="size-4" /> : "Sign out others"}
          </SecondaryButton>
        </SettingRow>
        <SettingRow label="Sign out of this device">
          <SecondaryButton onClick={() => signOut("local")} disabled={!!busy} className="flex items-center gap-1.5">
            {busy === "local" ? <Spinner className="size-4" /> : <FiLogOut size={14} />} Sign out
          </SecondaryButton>
        </SettingRow>
        <SettingRow label="Sign out everywhere" hint="Ends every session, including this one.">
          <button
            onClick={() => setConfirmGlobal(true)}
            disabled={!!busy}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Sign out everywhere
          </button>
        </SettingRow>
      </SettingsCard>

      <ConfirmDialog
        open={confirmGlobal}
        onClose={() => setConfirmGlobal(false)}
        danger
        confirmLabel="Sign out everywhere"
        title="Sign out of every device?"
        message="All sessions end, including this one. You'll need to sign in again."
        onConfirm={() => signOut("global")}
      />
    </div>
  );
}

/* ================================ Data ================================ */

type ExportLink = {
  title: string | null;
  short_code: string;
  original_url: string;
  clicks_count: number;
  unique_clicks_count: number;
  tags: string[] | null;
  is_active: boolean;
  archived_link: boolean;
  is_deleted: boolean;
  expires_at: string | null;
  created_at: string;
  last_clicked_at: string | null;
};

export function DataSection({ user, notify }: SectionProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function loadLinks(): Promise<ExportLink[]> {
    const { data, error } = await createClient()
      .from("links")
      .select(PUBLIC_LINK_COLUMNS)
      .eq("owner", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ExportLink[];
  }

  async function run(kind: string, fn: () => Promise<string>) {
    setBusy(kind);
    setStatus(null);
    try {
      notify(await fn());
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Export failed" });
    } finally {
      setBusy(null);
    }
  }

  const exportCsv = () =>
    run("csv", async () => {
      const links = await loadLinks();
      const rows = links.map((l) => ({
        title: l.title ?? "",
        short_url: getShortUrl(l.short_code),
        destination: l.original_url,
        clicks: l.clicks_count,
        unique_visitors: l.unique_clicks_count,
        tags: l.tags ?? [],
        status: l.is_deleted ? "deleted" : l.archived_link ? "archived" : l.is_active ? "active" : "disabled",
        expires_at: l.expires_at ?? "",
        created_at: l.created_at,
        last_clicked_at: l.last_clicked_at ?? "",
      }));
      download(
        exportFileName("links", "csv"),
        "﻿" + toCsv(rows, ["title", "short_url", "destination", "clicks", "unique_visitors", "tags", "status", "expires_at", "created_at", "last_clicked_at"]),
        "text/csv;charset=utf-8"
      );
      return `Exported ${rows.length} link${rows.length === 1 ? "" : "s"}`;
    });

  const exportJson = () =>
    run("json", async () => {
      const links = await loadLinks();
      download(exportFileName("links", "json"), JSON.stringify({ exported_at: new Date().toISOString(), links }, null, 2), "application/json");
      return `Exported ${links.length} link${links.length === 1 ? "" : "s"}`;
    });

  const exportBio = () =>
    run("bio", async () => {
      const res = await fetch("/api/bio/pages");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Couldn't load bio pages");
      const pages = (json.data ?? []) as unknown[];
      download(exportFileName("bio-pages", "json"), JSON.stringify({ exported_at: new Date().toISOString(), pages }, null, 2), "application/json");
      return `Exported ${pages.length} bio page${pages.length === 1 ? "" : "s"}`;
    });

  const item = (key: string, title: string, hint: string, label: string, onClick: () => void) => (
    <SettingRow label={title} hint={hint}>
      <SecondaryButton onClick={onClick} disabled={!!busy} className="flex items-center gap-1.5">
        {busy === key ? <Spinner className="size-4" /> : <FiDownload size={14} />} {label}
      </SecondaryButton>
    </SettingRow>
  );

  return (
    <SettingsCard
      title="Export your data"
      description="Download a copy of everything you've created. Files are generated in your browser."
      footer={status ? <StatusMessage status={status} /> : undefined}
    >
      {item("csv", "Links (CSV)", "Spreadsheet-friendly: titles, short URLs, destinations, clicks, tags, status and dates.", "Download CSV", exportCsv)}
      {item("json", "Links (JSON)", "Every field of every link, including archived and deleted ones.", "Download JSON", exportJson)}
      {item("bio", "Bio pages (JSON)", "Drafts, published versions and themes of all your bio pages.", "Download JSON", exportBio)}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
        <FiFileText size={12} /> Click-by-click history stays in Analytics.
      </p>
    </SettingsCard>
  );
}

/* ============================= Danger zone ============================ */

export function DangerSection({ user, notify }: SectionProps) {
  const [trashOpen, setTrashOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function trashAll() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("links")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("owner", user.id)
      .eq("is_deleted", false)
      .select("id");
    if (error) throw error;
    notify(`Moved ${data?.length ?? 0} link${data?.length === 1 ? "" : "s"} to trash`);
  }

  return (
    <div className="space-y-5">
      <SettingsCard danger title="Move all links to trash" description="Every link stops redirecting and moves to Deleted Links. You can restore them from there.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600">
            Reversible —{" "}
            <Link href="/dashboard/deleted" className="font-semibold text-neutral-900 hover:underline">
              open Deleted Links
            </Link>{" "}
            to restore or empty the trash.
          </p>
          <button
            onClick={() => setTrashOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <FiTrash2 size={14} /> Move all to trash
          </button>
        </div>
      </SettingsCard>

      <SettingsCard danger title="Delete account" description="Permanently deletes your account, links, QR codes, bio pages and analytics. This can't be undone.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600">Want a copy first? Export your data from the Data tab.</p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:scale-[0.97]"
          >
            <FiAlertTriangle size={14} /> Delete account
          </button>
        </div>
      </SettingsCard>

      <ConfirmDialog
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        danger
        confirmLabel="Move all to trash"
        title="Move every link to trash?"
        message="All your short links and QR codes stop redirecting until you restore them."
        onConfirm={trashAll}
      />
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} email={user.email ?? ""} />
    </div>
  );
}

function DeleteAccountDialog({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Delete your account" description={email}>
      {open && <DeleteAccountForm onClose={onClose} />}
    </Modal>
  );
}

function DeleteAccountForm({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function confirm() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", message: json.error ?? "Couldn't delete your account" });
        setBusy(false);
        return;
      }
      window.location.replace("/");
    } catch {
      setStatus({ kind: "error", message: "Network error — nothing was deleted." });
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-1.5 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
        {["All short links and their QR codes", "All bio pages and their analytics", "Your profile, preferences and sign-in methods"].map((t) => (
          <li key={t} className="flex items-start gap-1.5">
            <FiX className="mt-0.5 shrink-0" /> {t}
          </li>
        ))}
      </ul>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
          Type <span className="font-mono text-neutral-900">DELETE</span> to confirm
        </span>
        <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} className={inputCls} />
      </label>
      <StatusMessage status={status} />
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onClose} disabled={busy}>
          Cancel
        </SecondaryButton>
        <PrimaryButton danger onClick={confirm} disabled={busy || typed !== "DELETE"}>
          {busy && <Spinner className="size-4" />} Delete forever
        </PrimaryButton>
      </div>
    </div>
  );
}
