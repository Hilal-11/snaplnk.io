"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  FiSettings,
  FiUser,
  FiShield,
  FiBell,
  FiKey,
  FiUsers,
  FiCreditCard,
  FiSun,
  FiGlobe,
  FiLink,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiChevronRight,
  FiLogOut,
  FiTrash2,
  FiCopy,
  FiExternalLink,
  FiToggleLeft,
  FiClock,
  FiX,
  FiPlus,
  FiSearch,
  FiBarChart2,
  FiMail,
  FiSmartphone,
} from "react-icons/fi";

type Section = "general" | "profile" | "security" | "notifications" | "api-keys" | "team" | "billing" | "appearance";

const SECTIONS: { id: Section; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "general", label: "General", icon: FiSettings },
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "security", label: "Security", icon: FiShield },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "api-keys", label: "API Keys", icon: FiKey },
  { id: "team", label: "Team", icon: FiUsers },
  { id: "billing", label: "Billing", icon: FiCreditCard },
  { id: "appearance", label: "Appearance", icon: FiSun },
];

/* ─── General ─── */
function GeneralSettings() {
  const [domain, setDomain] = useState("snaplnk.io");
  const [defaultActive, setDefaultActive] = useState(true);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Manage your default link preferences and domain settings.</p>

      <div className="space-y-5">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">Default domain</p>
            <p className="text-xs text-neutral-500 mt-0.5">Domain used when creating new short links</p>
          </div>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-48 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400 text-right font-medium text-neutral-900"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-neutral-100">
          <div>
            <p className="text-sm font-medium text-neutral-900">New links active by default</p>
            <p className="text-xs text-neutral-500 mt-0.5">Automatically activate newly created links</p>
          </div>
          <button
            onClick={() => setDefaultActive((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors ${defaultActive ? "bg-neutral-900" : "bg-neutral-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${defaultActive ? "translate-x-4" : ""}`} />
          </button>
        </div>

        <div className="border-t border-neutral-100 pt-5">
          <p className="text-sm font-semibold text-neutral-900 mb-3">Default UTM Parameters</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Source</label>
              <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="e.g. snaplnk" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Medium</label>
              <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="e.g. social" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Campaign</label>
              <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="e.g. summer" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-neutral-100">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 transition">
          <FiSave size={15} />
          Save changes
        </button>
        {saved && <span className="flex items-center gap-1 text-xs font-medium text-green-600"><FiCheckCircle size={13} /> Saved</span>}
      </div>
    </div>
  );
}

/* ─── Profile ─── */
function ProfileSettings() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setName(user.user_metadata?.name || user.email?.split("@")[0] || "");
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { name } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="animate-spin text-neutral-400"><FiBarChart2 size={20} /></div></div>;

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Update your display name and personal information.</p>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Display name</label>
          <div className="flex items-center gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 max-w-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400" />
            <button onClick={handleSave} disabled={saving || !name.trim()} className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 transition disabled:opacity-40">
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && <FiCheckCircle size={18} className="text-green-600 shrink-0" />}
          </div>
        </div>

        <a href="/dashboard/profile" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition">
          View full profile <FiExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

/* ─── Security ─── */
function SecuritySettings() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");
    };
    fetchUser();
  }, []);

  const handleChangePassword = async () => {
    setPwdError("");
    setPwdSaved(false);
    if (newPwd.length < 6) { setPwdError("Password must be at least 6 characters"); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match"); return; }
    try {
      setSaving(true);
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPwd });
      if (signInErr) { setPwdError("Current password is incorrect"); setSaving(false); return; }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updateErr) throw updateErr;
      setPwdSaved(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Manage your password and account security.</p>

      <div className="space-y-5">
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-5">
          <p className="text-sm font-semibold text-neutral-900 mb-4">Change password</p>
          <div className="space-y-3 max-w-sm">
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Current password" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400 pr-9" />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">{showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}</button>
            </div>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="New password (min 6 chars)" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400 pr-9" />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">{showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}</button>
            </div>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Confirm new password" className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400" />
            {pwdError && <p className="text-xs font-medium text-red-500 flex items-center gap-1"><FiAlertCircle size={12} /> {pwdError}</p>}
            {pwdSaved && <p className="text-xs font-medium text-green-600 flex items-center gap-1"><FiCheckCircle size={12} /> Password updated successfully</p>}
            <button onClick={handleChangePassword} disabled={saving || !currentPwd || !newPwd || !confirmPwd} className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 transition disabled:opacity-40">
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Active sessions</p>
              <p className="text-xs text-neutral-500 mt-0.5">Manage your active login sessions</p>
            </div>
            <button className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition">Log out all</button>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-white border border-neutral-200 px-4 py-3">
            <FiSmartphone size={16} className="text-neutral-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">Current session</p>
              <p className="text-xs text-neutral-500">Windows • Chrome • {new Date().toLocaleDateString()}</p>
            </div>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><FiCheckCircle size={10} /> Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications ─── */
function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    weeklyReport: true,
    newClick: false,
    linkExpired: true,
    teamInvite: true,
    productUpdates: false,
  });

  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items = [
    { key: "weeklyReport" as const, label: "Weekly analytics report", desc: "Receive a weekly summary of your link performance" },
    { key: "newClick" as const, label: "New click notifications", desc: "Get notified whenever one of your links is clicked" },
    { key: "linkExpired" as const, label: "Link expiry alerts", desc: "Get notified when your links are about to expire" },
    { key: "teamInvite" as const, label: "Team invites", desc: "Receive email notifications for team invitations" },
    { key: "productUpdates" as const, label: "Product updates", desc: "Stay informed about new features and improvements" },
  ];

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Choose what updates and alerts you want to receive.</p>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ml-4 ${prefs[item.key] ? "bg-neutral-900" : "bg-neutral-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${prefs[item.key] ? "translate-x-4" : ""}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-neutral-100">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 transition">
          <FiSave size={15} />
          Save preferences
        </button>
        {saved && <span className="flex items-center gap-1 text-xs font-medium text-green-600"><FiCheckCircle size={13} /> Saved</span>}
      </div>
    </div>
  );
}

/* ─── API Keys ─── */
function ApiKeysSettings() {
  const [keys] = useState([
    { id: "1", name: "Production", key: "sk_live_••••••••••••••••", created: "Jan 15, 2026", lastUsed: "2 hours ago" },
    { id: "2", name: "Development", key: "sk_test_••••••••••••••••", created: "Mar 2, 2026", lastUsed: "5 days ago" },
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-500">Manage API keys for programmatic access to your links.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2.5 transition">
          <FiPlus size={14} />
          Create key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-10 text-center">
          <FiKey size={28} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No API keys yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <FiKey size={16} className="text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{k.name}</p>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">{k.key}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                    <span>Created {k.created}</span>
                    <span>Last used {k.lastUsed}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                <button className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition" title="Copy key"><FiCopy size={14} /></button>
                <button className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition" title="Revoke key"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Team ─── */
function TeamSettings() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [members] = useState([
    { id: "1", name: "Hilal Ahmad", email: "hilal@snaplnk.io", role: "Owner", avatar: "HA" },
    { id: "2", name: "Sarah Chen", email: "sarah@example.com", role: "Admin", avatar: "SC" },
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-neutral-500">Manage your team members and their permissions.</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-5 mb-6">
        <p className="text-sm font-semibold text-neutral-900 mb-3">Invite member</p>
        <div className="flex items-center gap-2">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter email address" className="flex-1 max-w-sm bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400" />
          <button disabled={!inviteEmail.trim()} className="flex items-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-4 py-2.5 transition disabled:opacity-40">
            <FiPlus size={14} />
            Invite
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.avatar}</div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{m.name}</p>
                <p className="text-xs text-neutral-500">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full px-2.5 py-1">{m.role}</span>
              {m.role !== "Owner" && (
                <button className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition" title="Remove"><FiX size={14} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Billing ─── */
function BillingSettings() {
  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Manage your subscription and billing information.</p>

      <div className="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-200 rounded-full px-2.5 py-0.5">FREE</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 tracking-tight mt-2">$0<span className="text-base font-medium text-neutral-400">/mo</span></p>
            <p className="text-sm text-neutral-500 mt-1">Free plan — 50 links, 10,000 clicks/mo</p>
          </div>
          <button className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold px-5 py-2.5 transition">
            Upgrade
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-neutral-200">
          {[
            { label: "Links", value: "12 / 50" },
            { label: "Clicks (this month)", value: "2,847 / 10,000" },
            { label: "Team members", value: "2 / 3" },
            { label: "Custom domains", value: "0 / 1" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-neutral-500">{stat.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full rounded-full bg-neutral-900" style={{ width: stat.label.startsWith("Links") ? "24%" : stat.label.startsWith("Clicks") ? "28%" : stat.label.startsWith("Team") ? "66%" : "0%" }} />
                </div>
                <span className="text-xs font-semibold text-neutral-900">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-900">Payment method</p>
        </div>
        <div className="p-5 text-center text-sm text-neutral-400">
          No payment method on file.
        </div>
      </div>
    </div>
  );
}

/* ─── Appearance ─── */
function AppearanceSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-6">Customize the appearance of your dashboard.</p>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-neutral-900 mb-3">Theme</p>
          <div className="flex gap-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                  theme === t
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <FiSun size={20} className={`mx-auto mb-2 ${theme === t ? "text-neutral-900" : "text-neutral-400"}`} />
                <p className={`text-sm font-semibold capitalize ${theme === t ? "text-neutral-900" : "text-neutral-500"}`}>{t}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-neutral-100">
          <div>
            <p className="text-sm font-medium text-neutral-900">Reduced motion</p>
            <p className="text-xs text-neutral-500 mt-0.5">Minimize animations throughout the dashboard</p>
          </div>
          <button className="relative w-10 h-6 rounded-full bg-neutral-300 transition-colors">
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function SettingsPage() {
  const [section, setSection] = useState<Section>("general");

  const renderSection = () => {
    switch (section) {
      case "general": return <GeneralSettings />;
      case "profile": return <ProfileSettings />;
      case "security": return <SecuritySettings />;
      case "notifications": return <NotificationSettings />;
      case "api-keys": return <ApiKeysSettings />;
      case "team": return <TeamSettings />;
      case "billing": return <BillingSettings />;
      case "appearance": return <AppearanceSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl lg:max-w-full mx-auto px-4 sm:px-6 lg:px-0">
        <h1 className="text-xl font-semibold text-neutral-900 mb-6">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
          <div className="w-full md:w-52 shrink-0">
            <nav className="md:space-y-0.5 md:sticky md:top-8 flex md:flex-row lg:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:bg-transparent">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      section === s.id
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline lg:inline">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-900 mb-1 capitalize">
                {SECTIONS.find((s) => s.id === section)?.label}
              </h2>
              <div className="mt-4">{renderSection()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
