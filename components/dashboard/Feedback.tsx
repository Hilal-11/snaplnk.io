"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Star,
  Bug,
  Sparkles,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { MdOutlineFeedback } from "react-icons/md";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedbackType = "bug" | "feature" | "improvement" | "question" | "general";

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "feature", label: "Feature", icon: Sparkles },
  { value: "improvement", label: "Improvement", icon: Lightbulb },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "general", label: "General", icon: MessageCircle },
];

type SubmitState = "idle" | "submitting" | "success" | "error";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Feedback() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        <MdOutlineFeedback className="text-[14px]" />
        Feedback
      </button>

      <AnimatePresence>
        {open && <FeedbackModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    state !== "submitting";



async function handleSubmit() {
  if (!canSubmit) return;

  setState("submitting");
  setError(null);

  try {
    const payload = {
      type,
      title: title.trim(),
      message: message.trim(),
      ...(rating !== null && { rating }),
    };

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Feedback API error:", body);

      const validationError =
        body?.errors &&
        Object.values(body.errors).flat()[0];

      setError(
        validationError ||
        body?.message ||
        "Something went wrong."
      );

      setState("error");
      return;
    }

    setState("success");

    setTimeout(() => {
      onClose();
    }, 1600);
  } catch (err) {
    console.error("Feedback submit failed:", err);
    setError("Something went wrong. Please try again.");
    setState("error");
  }
}

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_1px_1px_rgba(0,0,0,0.03),0_4px_8px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        {state === "success" ? (
          <SuccessView />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white shrink-0">
                  <MdOutlineFeedback className="text-[16px]" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-neutral-900 leading-none">
                    Send feedback
                  </h2>
                  <p className="text-[13px] text-neutral-500 mt-1">
                    Tell us what&apos;s on your mind
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              {/* Type selector */}
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TYPES.map(({ value, label, icon: Icon }) => {
                  const active = type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                        active
                          ? "bg-black text-white border-black"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500 px-1">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Short summary of your feedback"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-shadow"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500 px-1">
                  Details
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Give us as much detail as you can"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 resize-none transition-shadow"
                />
              </div>

              {/* Rating (optional) */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] font-medium text-neutral-500">
                  Rating (optional)
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = (hoverRating ?? rating ?? 0) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(rating === n ? null : n)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-[18px] h-[18px] transition-colors ${
                            filled
                              ? "fill-black text-black"
                              : "fill-transparent text-neutral-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-[13px] text-red-600 px-1">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-black text-white text-[14px] font-medium hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-black transition-colors"
              >
                {state === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send feedback"
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function SuccessView() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-neutral-900">
          Feedback sent
        </p>
        <p className="text-[13px] text-neutral-500 mt-1">
          Thanks for helping us improve Snaplnk.
        </p>
      </div>
    </div>
  );
}