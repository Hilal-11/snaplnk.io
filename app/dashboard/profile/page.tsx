"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiLink,
  FiMousePointer,
  FiTarget,
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit2,
  FiSave,
  FiX,
  FiCopy,
  FiShield,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiExternalLink,
  FiGlobe,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";

export default function ProfilePage() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    created_at: string;
    name: string;
  } | null>(null);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, totalQr: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authUser) { setError("Please sign in"); return; }

        const name = authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User";
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          created_at: authUser.created_at ?? "",
          name,
        });
        setNameValue(name);

        const { data: links } = await supabase
          .from("links")
          .select("clicks_count, qr_code_url")
          .eq("owner", authUser.id)
          .eq("is_deleted", false);

        setStats({
          totalLinks: links?.length ?? 0,
          totalClicks: links?.reduce((s, l) => s + (l.clicks_count || 0), 0) ?? 0,
          totalQr: links?.filter((l) => l.qr_code_url).length ?? 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveName = async () => {
    try {
      setSavingName(true);
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ data: { name: nameValue } });
      if (err) throw err;
      setUser((prev) => (prev ? { ...prev, name: nameValue } : prev));
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
      setEditingName(false);
    } catch (err: any) {
      console.error("Failed to update name:", err);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdError("");
    setPwdSaved(false);
    if (newPwd.length < 6) { setPwdError("Password must be at least 6 characters"); return; }
    try {
      setSavingPwd(true);
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user!.email, password: currentPwd,
      });
      if (signInErr) { setPwdError("Current password is incorrect"); setSavingPwd(false); return; }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updateErr) throw updateErr;
      setPwdSaved(true);
      setCurrentPwd(""); setNewPwd("");
      setTimeout(() => { setPwdSaved(false); setShowPwdForm(false); }, 2000);
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password");
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-neutral-400"><FiBarChart2 size={28} /></div>
          <p className="mt-4 text-sm text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center max-w-md">
          <FiAlertCircle size={28} className="text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-700 font-semibold text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        {/* ── Hero Banner ── */}
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-500 overflow-hidden mb-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative px-7 pt-12 pb-7">
            <div className="flex items-end gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-neutral-900 text-2xl font-bold shadow-lg shrink-0 -mt-10 border-4 border-white/30">
                {initials}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="text-xl font-bold text-white bg-white/15 border border-white/25 rounded-lg px-3 py-1.5 outline-none focus:border-white/50 w-full max-w-xs backdrop-blur-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={savingName || !nameValue.trim()} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition disabled:opacity-40 backdrop-blur-sm" title="Save"><FiSave size={15} /></button>
                    <button onClick={() => { setEditingName(false); setNameValue(user?.name ?? ""); }} className="p-2 rounded-lg text-white/70 hover:bg-white/10 transition" title="Cancel"><FiX size={15} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{user?.name}</h1>
                    <button onClick={() => setEditingName(true)} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition" title="Edit name"><FiEdit2 size={13} /></button>
                    {nameSaved && <span className="flex items-center gap-1 text-xs font-medium text-green-300"><FiCheckCircle size={12} /> Saved</span>}
                  </div>
                )}
                <p className="text-sm text-neutral-300 mt-1 flex items-center gap-1.5">
                  <FiMail size={12} /> {user?.email}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                  <FiCalendar size={11} /> Member since {memberSince}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: FiLink, label: "Total Links", value: stats.totalLinks, sub: "links created" },
            { icon: FiMousePointer, label: "Total Clicks", value: stats.totalClicks.toLocaleString(), sub: "across all links" },
            { icon: FiTarget, label: "QR Codes", value: stats.totalQr, sub: "generated" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white border border-neutral-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <stat.icon size={16} className="text-neutral-700" />
                </div>
                <span className="text-xs font-medium text-neutral-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Two-column section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* Account Details */}
          <div className="lg:col-span-3 rounded-xl bg-white border border-neutral-200/80 shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900">Account Details</p>
            </div>
            <div className="divide-y divide-neutral-100">
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FiMail size={15} className="text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-600">Email</span>
                </div>
                <span className="text-sm font-medium text-neutral-900 truncate max-w-[240px]">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FiShield size={15} className="text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-600">User ID</span>
                </div>
                <CopyButton value={user?.id ?? ""} />
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FiGlobe size={15} className="text-neutral-400 shrink-0" />
                  <span className="text-sm text-neutral-600">Default domain</span>
                </div>
                <span className="text-sm font-medium text-neutral-900">snaplnk.io</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-neutral-200/80 shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900">Quick Links</p>
            </div>
            <div className="divide-y divide-neutral-100">
              {[
                { href: "/dashboard/links", label: "My Links", icon: FiLink },
                { href: "/dashboard/analytics", label: "Analytics", icon: FiBarChart2 },
                { href: "/dashboard/qr-codes", label: "QR Codes", icon: FiTarget },
                { href: "/dashboard/settings", label: "Settings", icon: FiLock },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={15} className="text-neutral-400 shrink-0" />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">{item.label}</span>
                  </div>
                  <FiArrowRight size={14} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Password ── */}
        <div className="rounded-xl bg-white border border-neutral-200/80 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiLock size={15} className="text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-900">Password</p>
            </div>
            <button
              onClick={() => { setShowPwdForm((v) => !v); setPwdError(""); setPwdSaved(false); }}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
            >
              {showPwdForm ? "Cancel" : "Change password"}
            </button>
          </div>
          {showPwdForm && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Current password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400 pr-9"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">{showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1.5 block">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neutral-400 pr-9"
                    placeholder="Min 6 characters"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">{showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}</button>
                </div>
              </div>
              {pwdError && <p className="text-xs font-medium text-red-500 flex items-center gap-1"><FiAlertCircle size={12} /> {pwdError}</p>}
              {pwdSaved && <p className="text-xs font-medium text-green-600 flex items-center gap-1"><FiCheckCircle size={12} /> Password updated successfully</p>}
              <button
                onClick={handleChangePassword}
                disabled={savingPwd || !currentPwd || !newPwd}
                className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold py-2.5 transition disabled:opacity-40"
              >
                {savingPwd ? "Updating..." : "Update password"}
              </button>
            </div>
          )}
          {!showPwdForm && (
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">••••••••••••</p>
                <p className="text-xs text-neutral-400 mt-0.5">Last changed —</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="rounded-xl bg-white border border-red-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <FiTrash2 size={14} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-red-600">Danger Zone</p>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                <FiAlertCircle size={14} className="text-neutral-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Delete your account</p>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-sm">
                  Permanently remove your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert("Account deletion is not available in this demo.")}
              className="flex items-center gap-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 transition shrink-0 ml-4"
            >
              <FiTrash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-mono text-neutral-500 hover:text-neutral-900 transition group">
      <span className="truncate max-w-[180px]">{value.slice(0, 12)}...{value.slice(-4)}</span>
      {copied ? <FiCheckCircle size={13} className="text-green-600 shrink-0" /> : <FiCopy size={13} className="shrink-0 text-neutral-400 group-hover:text-neutral-600" />}
    </button>
  );
}
