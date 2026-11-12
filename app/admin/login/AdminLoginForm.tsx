"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { FiAlertTriangle, FiEye, FiEyeOff, FiLock, FiShield } from "react-icons/fi";
import Logo from "@/components/Logo";
import { Spinner } from "@/components/ui/spinner";
import { adminOAuth, adminPasswordSignIn, type AdminLoginState } from "./actions";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-brand/60 focus:bg-white focus:shadow-[0_0_0_3px_var(--brand-soft)]";

export default function AdminLoginForm({ message }: { message: string | null }) {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminPasswordSignIn, null);
  const [show, setShow] = useState(false);
  const error = state?.error ?? message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]"
    >
      <div className="relative border-b border-neutral-100 px-6 pb-5 pt-6">
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-dots mask-fade-radial opacity-80" />
        <div className="relative flex items-center gap-2.5">
          <Logo size={30} />
          <span className="font-semibold tracking-tight text-neutral-900">
            Snaplnk<span className="text-brand">.</span>io
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <FiShield size={10} /> Admin
          </span>
        </div>
        <h1 className="relative mt-5 text-xl font-bold tracking-tight text-neutral-900">Admin sign in</h1>
        <p className="relative mt-1 text-xs text-neutral-500">Restricted area. Every attempt is logged.</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            <FiAlertTriangle className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <div className="grid gap-2">
          {(
            [
              { id: "google", label: "Continue with Google", icon: <FcGoogle size={16} /> },
              { id: "github", label: "Continue with GitHub", icon: <FaGithub size={16} /> },
            ] as const
          ).map((p) => (
            <form key={p.id} action={adminOAuth.bind(null, p.id)}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98]"
              >
                {p.icon} {p.label}
              </button>
            </form>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={formAction} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Email</span>
            <input name="email" type="email" required autoComplete="username" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-neutral-500">Password</span>
            <span className="relative block">
              <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className={`${inputCls} pr-10`} />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-neutral-700"
              >
                {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg btn-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? <Spinner className="size-4" /> : <FiLock size={14} />} Sign in
          </button>
        </form>
      </div>
    </motion.div>
  );
}
