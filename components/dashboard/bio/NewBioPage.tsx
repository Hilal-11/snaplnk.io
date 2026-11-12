"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiAtSign, FiCheck, FiX } from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";
import { TEMPLATES, type BioTemplate } from "@/lib/bio/templates";
import { DEFAULT_THEME } from "@/lib/bio/theme";
import { checkUsername } from "@/lib/bio/reserved";
import { getBaseUrl } from "@/lib/utils/getShortUrl";
import BioPreviewFrame from "./BioPreviewFrame";

const BLANK: BioTemplate = {
  id: "blank",
  name: "Blank",
  category: "start fresh",
  description: "Start from scratch and build your own page.",
  profile: { displayName: "Your Name", bio: "" },
  theme: DEFAULT_THEME,
  blocks: [],
};
const ALL = [BLANK, ...TEMPLATES];

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; username: string }
  | { state: "unavailable"; message: string };

const withIds = (t: BioTemplate) =>
  t.blocks.map((b, j) => ({ ...b, id: `00000000-0000-4000-8000-${String(j).padStart(12, "0")}` }));

export default function NewBioPage({ initialTemplate }: { initialTemplate: string }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(ALL.some((t) => t.id === initialTemplate) ? initialTemplate : "link-hub");
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const template = ALL.find((t) => t.id === templateId) ?? BLANK;
  const host = getBaseUrl().replace(/^https?:\/\//, "");

  function onUsernameChange(raw: string) {
    const value = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    setUsername(value);
    setError(null);
    if (timer.current) clearTimeout(timer.current);

    if (!value) return setAvailability({ state: "idle" });
    const local = checkUsername(value);
    if (local.status !== "ok") return setAvailability({ state: "unavailable", message: local.message });

    setAvailability({ state: "checking" });
    const id = ++reqId.current;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bio/username-check?u=${encodeURIComponent(value)}`);
        const json = await res.json().catch(() => ({}));
        if (id !== reqId.current) return; // a newer keystroke won
        if (!res.ok) return setAvailability({ state: "unavailable", message: json.error ?? "Couldn't check right now" });
        setAvailability(
          json.status === "available"
            ? { state: "available", username: json.username }
            : { state: "unavailable", message: json.message ?? "Not available" }
        );
      } catch {
        if (id === reqId.current) setAvailability({ state: "unavailable", message: "Network error — try again" });
      }
    }, 400);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (availability.state !== "available") return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/bio/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: availability.username, template_id: templateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Couldn't create the page");
        if (res.status === 409) setAvailability({ state: "unavailable", message: "That username was just taken" });
        setCreating(false);
        return;
      }
      router.push(`/dashboard/bio-pages/${json.data.id}/edit`);
    } catch {
      setError("Network error — please try again");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/dashboard/bio-pages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <FiArrowLeft size={14} /> Back to bio pages
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create your bio page</h1>
        <p className="mt-1 text-sm text-neutral-500">Claim your link, pick a look — you can edit everything next.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {/* Step 1: username */}
          <form
            onSubmit={create}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.08)]"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-white">1</span>
              Claim your link
            </p>
            <label htmlFor="bio-username" className="sr-only">Username</label>
            <div
              className={`mt-3 flex items-center rounded-lg border bg-neutral-50 transition-[border-color,box-shadow] focus-within:bg-white ${
                availability.state === "unavailable"
                  ? "border-red-300 focus-within:shadow-[0_0_0_3px_rgb(239_68_68/0.12)]"
                  : availability.state === "available"
                    ? "border-emerald-300 focus-within:shadow-[0_0_0_3px_rgb(16_185_129/0.12)]"
                    : "border-neutral-200 focus-within:border-brand/60 focus-within:shadow-[0_0_0_3px_var(--brand-soft)]"
              }`}
            >
              <span className="pl-3 text-sm text-neutral-400 whitespace-nowrap">{host}/</span>
              <FiAtSign className="text-neutral-400" size={14} />
              <input
                id="bio-username"
                autoFocus
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="yourname"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent py-2.5 pr-2 text-sm font-semibold text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400"
              />
              <span className="pr-3">
                {availability.state === "checking" && <Spinner className="size-4 text-neutral-400" />}
                {availability.state === "available" && <FiCheck className="text-emerald-600" />}
                {availability.state === "unavailable" && <FiX className="text-red-500" />}
              </span>
            </div>
            <p
              className={`mt-1.5 min-h-4 text-xs ${
                availability.state === "unavailable" ? "text-red-600" : availability.state === "available" ? "text-emerald-700" : "text-neutral-400"
              }`}
              aria-live="polite"
            >
              {availability.state === "unavailable"
                ? availability.message
                : availability.state === "available"
                  ? `@${availability.username} is available`
                  : "3–30 characters: lowercase letters, numbers and underscores."}
            </p>

            {error && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                <FiAlertCircle /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={availability.state !== "available" || creating}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg btn-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Spinner className="size-4" /> : null}
              {creating ? "Creating your page..." : `Create with "${template.name}" & start editing`}
              {!creating && <FiArrowRight size={14} />}
            </button>
          </form>

          {/* Step 2: template */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-white">2</span>
              Choose a template
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 max-w-md" role="radiogroup" aria-label="Template">
              {ALL.map((t) => {
                const active = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTemplateId(t.id)}
                    className={`group flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-all ${
                      active ? "border-brand ring-2 ring-brand/20" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="overflow-hidden rounded-md border border-neutral-100">
                      <BioPreviewFrame width={96} aspect={1.35} profile={t.profile} theme={t.theme} blocks={withIds(t)} username="yourname" />
                    </div>
                    <span className={`text-[11px] font-semibold ${active ? "text-neutral-900" : "text-neutral-500"}`}>{t.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-neutral-500">{template.description}</p>
          </div>
        </div>

        {/* Live preview */}
        <aside className="lg:col-span-2 flex justify-center lg:sticky lg:top-24 self-start">
          <div className="rounded-[2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-[0px_24px_48px_-16px_rgba(0,0,0,0.35)]">
            <div className="overflow-hidden rounded-[1.6rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={templateId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <BioPreviewFrame
                    width={280}
                    profile={{
                      displayName: template.profile.displayName,
                      bio: template.profile.bio,
                    }}
                    theme={template.theme}
                    blocks={withIds(template)}
                    username={availability.state === "available" ? availability.username : username || "yourname"}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
