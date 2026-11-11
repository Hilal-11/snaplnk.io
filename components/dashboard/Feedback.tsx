"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { Spinner } from "@/components/ui/spinner";

type FeedbackType = "bug" | "feature" | "improvement" | "question" | "general";

const TOPICS: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "improvement", label: "Improvement" },
  { value: "question", label: "Question" },
  { value: "general", label: "General" },
];

// Emoji reactions mapped onto the API's 1–5 rating.
const MOODS = [
  { rating: 1, emoji: "😭", label: "Very unhappy" },
  { rating: 2, emoji: "🙁", label: "Unhappy" },
  { rating: 4, emoji: "🙂", label: "Happy" },
  { rating: 5, emoji: "😍", label: "Love it" },
];

const MIN_MESSAGE = 10;

type SubmitState = "idle" | "submitting" | "success";

export default function Feedback() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[0.97] ${
          open
            ? "border-neutral-300 bg-neutral-100 text-neutral-900"
            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
        }`}
      >
        Feedback
      </button>

      <AnimatePresence>
        {open && <FeedbackPopover onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function FeedbackPopover({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [topic, setTopic] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= MIN_MESSAGE && state === "idle";

  async function submit() {
    if (!canSubmit) {
      if (trimmed.length < MIN_MESSAGE) setError(`Please write at least ${MIN_MESSAGE} characters.`);
      return;
    }
    setState("submitting");
    setError(null);

    // The API needs a title; derive it from the first line of the message.
    const firstLine = trimmed.split("\n")[0].trim();
    const title = (firstLine.length >= 5 ? firstLine : trimmed).slice(0, 100);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: topic || "general",
          title,
          message: trimmed,
          pageUrl: pathname,
          ...(rating !== null && { rating }),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const validation = body?.errors && (Object.values(body.errors).flat()[0] as string | undefined);
        setError(validation || body?.error || body?.message || "Something went wrong.");
        setState("idle");
        return;
      }
      setState("success");
      setTimeout(onClose, 1500);
    } catch {
      setError("Network error — please try again.");
      setState("idle");
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-label="Send feedback"
      initial={{ opacity: 0, x: "-50%", y: -6, scale: 0.96 }}
      animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
      exit={{ opacity: 0, x: "-50%", y: -4, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 520, damping: 34 }}
      style={{ transformOrigin: "top center" }}
      className="absolute left-1/2 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.02),0_12px_32px_-8px_rgb(0_0_0/0.25)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "success" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 16 }}
              className="flex h-9 w-9 items-center justify-center rounded-full btn-brand"
            >
              <FiCheck size={18} />
            </motion.span>
            <p className="text-sm font-semibold text-neutral-900">Thanks for the feedback!</p>
            <p className="text-xs text-neutral-500">We read every message.</p>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <div className="space-y-2 p-2">
              {/* Topic */}
              <div className="relative">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as FeedbackType | "")}
                  aria-label="Topic"
                  className={`w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 pr-8 text-sm font-medium outline-none transition-colors hover:border-neutral-300 focus:border-neutral-400 ${
                    topic ? "text-neutral-900" : "text-neutral-500"
                  }`}
                >
                  <option value="" disabled>
                    Select a topic...
                  </option>
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  size={15}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                />
              </div>

              {/* Message */}
              <textarea
                autoFocus
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={4}
                maxLength={2000}
                placeholder="Your feedback..."
                aria-label="Your feedback"
                className="block w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 hover:border-neutral-300 focus:border-neutral-400"
              />

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-1 text-xs text-red-600"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/60 px-2 py-2">
              <div className="flex items-center gap-0.5" role="radiogroup" aria-label="How do you feel?">
                {MOODS.map((m) => {
                  const active = rating === m.rating;
                  return (
                    <motion.button
                      key={m.rating}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={m.label}
                      title={m.label}
                      onClick={() => setRating(active ? null : m.rating)}
                      whileHover={{ scale: 1.2, rotate: -8 }}
                      whileTap={{ scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-[filter,opacity,background-color] ${
                        active
                          ? "bg-brand-soft ring-1 ring-brand/50"
                          : rating === null
                            ? "grayscale hover:grayscale-0"
                            : "grayscale opacity-50 hover:opacity-100 hover:grayscale-0"
                      }`}
                    >
                      {m.emoji}
                    </motion.button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={state === "submitting"}
                className="flex min-w-[64px] items-center justify-center gap-1.5 rounded-lg btn-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {state === "submitting" ? <Spinner className="size-3.5" /> : "Send"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
