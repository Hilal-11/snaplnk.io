'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa6'
import {
  HiEnvelope,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
} from 'react-icons/hi2'
import { IoIosArrowRoundForward } from 'react-icons/io'
import { signIn, signUp, signInWithGithub, signInWithGoogle } from '@/app/auth/actions'
import { useSearchParams } from 'next/navigation'
import { HiArrowLeft } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// inside the component
/* ── Animation variants ───────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

const socialStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const socialItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

const rightPanelVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' as const, delay: 0.2 },
  },
}

/* ── Social button ────────────────────────────────────────── */

function SocialButton({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode
  label: string
  action: () => void
}) {
  return (
    <motion.div variants={socialItem}>
      <form action={action}>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3 font-sans font-medium text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 cursor-pointer shadow-[0px_1px_2px_rgba(0,0,0,0.04)]"
        >
          <span className="text-xl leading-none">{icon}</span>
          {label}
        </motion.button>
      </form>
    </motion.div>
  )
}

/* ── Submit button ────────────────────────────────────────── */

function SubmitButton({ text, loading }: { text: string; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex items-center justify-center w-full rounded-xl bg-neutral-900 dark:bg-white px-6 py-3 font-sans font-semibold text-sm text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 select-none"
    >
      <span className="flex items-center gap-1.5">
        <span>{loading ? 'Please wait…' : text}</span>
        {!loading && (
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <IoIosArrowRoundForward className="text-lg" />
          </span>
        )}
      </span>
    </button>
  )
}

/* ── Decorative right panel ───────────────────────────────── */



/* ── Main page ─────────────────────────────────────────────── */

export default function LoginPage() {
 const [mode, setMode]               = useState<'signin' | 'signup'>('signup')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [emailError, setEmailError]   = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [message, setMessage]         = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const searchParams  = useSearchParams()
  const hasAuthError  = searchParams.get('error') === 'auth'
  const router = useRouter()

  const validate = (): boolean => {
    let valid = true
    setEmailError('')
    setPasswordError('')

    if (!email.trim()) {
      setEmailError('Email is required')
      valid = false
    }
    if (!password) {
      setPasswordError('Password is required')
      valid = false
    }
    return valid
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result   = mode === 'signin' ? await signIn(formData) : await signUp(formData)

  if (result?.error)             setMessage({ type: 'error',   text: result.error })
if (result && 'success' in result) setMessage({ type: 'success', text: result.success })
    setIsLoading(false)
  }

  return (
    <main className="font-sans min-h-screen bg-white dark:bg-neutral-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
      
        {/* ── LEFT: Form panel ── */}
        <div className="relative  flex flex-col justify-center w-full lg:w-[45%] px-6 md:px-12 lg:px-16 py-10 pt-10 lg:pt-0">
          <motion.button
            variants={fadeUp}
            onClick={() => router.back()}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="absolute lg:top-10 left-6 top-6 lg:left-38 w-fit flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors duration-200 group cursor-pointer"
          >
            <HiArrowLeft className="text-sm transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span className="text-sm font-sans font-medium">Back to home</span>
          </motion.button>

          <div className="w-full max-w-md mx-auto mt-14">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col"
            >
              {/* Brand */}
              <motion.div variants={fadeUp}>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <Image src={'/snaplinklogolight.svg'} width={100} height={100} alt={"snaplnk.io"} className="lg:w-18 lg:h-18 w-12 h-12"></Image>
                  <span className="text-[40px] lg:text-7xl font-bold tracking-tight font-sans">
                    Snaplnk<span className="bg-gradient-to-r from-[#F64C18] to-[#EE9539] bg-clip-text text-transparent">.io</span>
                  </span>
                </Link>
              </motion.div>

              {/* Heading */}
              <motion.div variants={fadeUp} className="mt-10 mb-8">
                <h1 className="text-xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight font-sans">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400 font-medium text-sm font-sans">
                  {mode === 'signin'
                    ? 'Sign in to your workspace.'
                    : 'Get started with Lokalhost.io.'}
                </p>
              </motion.div>

              {/* Auth error from callback */}
              <AnimatePresence>
                {hasAuthError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-sm font-sans text-red-600 dark:text-red-400"
                  >
                    Authentication failed. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mb-4 px-4 py-3 rounded-xl border text-sm font-sans ${
                      message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social buttons */}
              <motion.div variants={socialStagger} className="space-y-3">
                <SocialButton icon={<FcGoogle />} label="Continue with Google" action={signInWithGoogle} />
                <SocialButton icon={<FaGithub />} label="Continue with GitHub" action={signInWithGithub} />
              </motion.div>

              {/* Divider */}
              <motion.div variants={fadeUp} className="flex items-center gap-4 my-6">
                <span className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
                <span className="text-neutral-400 dark:text-neutral-600 text-xs font-medium font-sans flex-shrink-0">
                  or continue with email
                </span>
                <span className="flex-1 border-t border-neutral-200 dark:border-neutral-800" />
              </motion.div>

              {/* Form */}
              <motion.form
                variants={fadeUp}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium font-sans text-neutral-700 dark:text-neutral-300 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                      <HiEnvelope />
                    </span>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                      placeholder="you@example.com"
                      className={`w-full rounded-xl border px-4 py-3 pl-11 text-sm font-sans font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 bg-white dark:bg-neutral-900 outline-none transition-all duration-200 focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 ${
                        emailError
                          ? 'border-red-300 dark:border-red-700'
                          : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1 text-xs font-medium font-sans text-red-500">{emailError}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-medium font-sans text-neutral-700 dark:text-neutral-300"
                    >
                      Password
                    </label>
                    {mode === 'signin' && (
                      <Link
                        href="/forgot-password"
                        className="text-neutral-500 dark:text-neutral-400 text-sm font-medium font-sans hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">
                      <HiLockClosed />
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError('') }}
                      placeholder="••••••••"
                      minLength={6}
                      className={`w-full rounded-xl border px-4 py-3 pl-11 pr-11 text-sm font-sans font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 bg-white dark:bg-neutral-900 outline-none transition-all duration-200 focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 ${
                        passwordError
                          ? 'border-red-300 dark:border-red-700'
                          : 'border-neutral-200 dark:border-neutral-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-xs font-medium font-sans text-red-500">{passwordError}</p>
                  )}
                </div>

                <SubmitButton
                  text={mode === 'signin' ? 'Sign in' : 'Create account'}
                  loading={isLoading}
                />
              </motion.form>

              {/* Toggle mode */}
              <motion.div variants={fadeUp} className="mt-8 text-center">
                <span className="text-neutral-500 dark:text-neutral-400 text-sm font-medium font-sans">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}
                  className="text-neutral-800 dark:text-neutral-200 font-semibold text-sm font-sans underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Visual panel (hidden on mobile) ── */}
        <div className="w-full lg:flex lg:w-[55%] relative items-center justify-center  overflow-hidden lg:min-h-screen">
          {/* Decorative blurred blobs */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-300 rounded-full blur-3xl opacity-40" />
          </div>

          <motion.div
            variants={rightPanelVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center"
          >
            <div className="hidden lg:flex relative w-full h-full border bg-white/90 border-black/20 rounded-2xl overflow-hidden mask-b-from-20% mask-r-from-20% mask-r-to-100% mask-b-to-100% shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
                <Image
                                src="/snaplnk.webp"
                                width={900}
                                height={900}  
                                alt={"snaplnk.io"}
                                className="w-full h-full object-cover"
                              />
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  )
}