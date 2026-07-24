"use client"
import React, { useState , useEffect } from 'react'
import { BsStars } from 'react-icons/bs'
import { FiBarChart2, FiBell, FiCheckSquare, FiGrid, FiLink, FiLoader } from 'react-icons/fi'
import {  FiDownload } from 'react-icons/fi'
import TrustedSection from './TrustedSection'
import { HiOutlineExternalLink } from "react-icons/hi";
import { FiArrowRight, FiEdit3 } from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa6";
import { IoInfiniteSharp } from "react-icons/io5";
export default function Hero() {
   const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  
  async function handleCreate() {
    setError(null);
    setShortUrl(null);

    if (!url.trim()) {
      setError("Please paste a URL first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_url: url.trim() }),
      });

      const json = await res.json();

      if (!json.data?.short_code) {
        setError("Something went wrong — no short code returned.");
        return;
      }
      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      setShortUrl(`${base.replace(/\/$/, '')}/${json.data.short_code}`);
      setUrl("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="relative font-sans w-full overflow-hidden px-4 lg:pt-12">
      
      <div
        className="pointer-events-none absolute top-0 left-0 w-[480px] h-[480px] lg:w-[840px] lg:h-[740px] z-0"
  style={{
    maskImage:
      'linear-gradient(to bottom, transparent 0%, black 15%, black 30%, transparent 85%), linear-gradient(to right, transparent 0%, black 15%, black 30%, transparent 85%)',
    WebkitMaskImage:
      'linear-gradient(to bottom, transparent 0%, black 15%, black 30%, transparent 85%), linear-gradient(to right, transparent 0%, black 15%, black 30%, transparent 85%)',
    maskComposite: 'intersect',
    WebkitMaskComposite: 'source-in',
  }}
      >
        <InteractiveGridPattern
          width={20}
          height={20}
          squares={[40, 40]}
          squaresClassName="hover:fill-neutral-200/70 fill-neutral-100/40"
          className="w-full h-full"
        />
      </div>
      {/* Top Badge */}
      <div className="flex justify-center mt-8 mb-10 ">
        <span className="relative inline-flex items-center gap-2 overflow-hidden
            bg-neutral-100 border border-neutral-50 rounded-full
            pl-2 pr-4 h-7.5 w-72 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]">

            {/* shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]
            bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

            {/* icon bubble */}
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black  flex-shrink-0">
              <HiOutlineExternalLink className="text-neutral-100 text-xs" />
            </span>

            <span className="text-xs font-medium text-neutral-900 tracking-wide whitespace-nowrap">
              Lets make a magic link in one click
            </span>

            <span className="absolute right-0 h-10 w-8 bg-black text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap flex justify-center items-center">
              <FaLocationArrow size={17}/>
            </span>
        </span>
      </div>

      {/* Heading block */}
      <div className="text-center container mx-auto max-w-5xl">

  {/* Big heading */}
  <h1 className="text-2xl lg:text-5xl font-bold text-gray-900 tracking-tight">
    Snaplnk.io — Shorten Track Share smarter.{' '}
    <span className="relative inline-block">
      <span className="relative z-10">short Links </span>
       deeper engagement
    </span>
  </h1>

    {/* Description with inline badges */}
    <p className="mt-6 font-sans font-medium text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto text-center">
      The fastest way to shorten, share, and track your links. Create{' '}
      <InlineBadge icon={<FiLink className="text-black text-xs" />} label="Short Links" />,
      generate{' '}
      <InlineBadge icon={<FiGrid className="text-black text-xs" />} label="QR Codes" />,
      and monitor{' '}
      <InlineBadge icon={<FiBarChart2 className="text-black text-xs" />} label="Click Analytics" />{' '}
      — all in one dashboard built for speed.
    </p>
    {/* Input box URL-LINK */}

    <div className="font-sans flex flex-col justify-center items-center gap-6 w-full mt-12">

      <div className="p-1 max-w-2xl w-full mx-auto rounded-xl border border-neutral-300/70 bg-gradient-to-br from-neutral-50 to-neutral-100 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">

        <div className="border-t border-neutral-200/90 relative flex items-center bg-white rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_4px_12px_rgba(0,0,0,0.05)] focus-within:border-neutral-400 focus-within:shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">

        {/* Link icon */}
        <span className="pl-2 pr-2 flex items-center text-neutral-400">
          <Image src="/linkIcon.svg" width={25} height={25} alt={"Link icon"} />
        </span>

        {/* Input */}
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Paste your long URL"
          className="flex-1 bg-transparent py-3 pr-2 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal outline-none min-w-0"
        />

        {/* Button */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="m-1 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-semibold px-3.5 py-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FiLoader className="text-xs animate-spin" />
          ) : (
            <>
              short link
              <FiArrowRight className="text-xs" />
            </>
          )}
        </button>

      </div>

      {/* Error message */}
      {error && <p className="mt-2 text-xs text-red-600 px-1">{error}</p>}

      {shortUrl && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm">
          <Link
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline truncate"
          >
            {shortUrl}
          </Link>
        </div>
      )}

      </div>

      {/* Feature list */}
      <ul className="flex flex-wrap gap-x-0 gap-y-2 justify-center items-center text-xs font-semibold text-neutral-600">
        <li className="flex items-center gap-1 bg-white rounded-full pl-1.5 pr-3">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black flex-shrink-0">
            <FiEdit3 className="text-white text-[8px]" />
          </span>
          Customize your link
        </li>
        <li className="flex items-center gap-1 bg-white rounded-full pl-1.5 pr-3 py-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black flex-shrink-0">
            <IoInfiniteSharp className="text-white text-[8px]" />
          </span>
          Unlimited short links
        </li>
        <li className="flex items-center gap-1 bg-white rounded-full pl-1.5 pr-3 py-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black flex-shrink-0">
            <FiLink className="text-white text-[8px]" />
          </span>
          Custom alias links
        </li>
        <li className="flex items-center gap-1 bg-white rounded-full pl-1.5 pr-3 py-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-black flex-shrink-0">
            <FiBarChart2 className="text-white text-[8px]" />
          </span>
          Complete link tracking
        </li>
      </ul>

    </div>


    </div>
      {/* Hero Image — Note Cards Board */}
      <div className="lg:mt-22 mt-12 p-2 lg:p-5 max-w-7xl mx-auto h-auto lg:h-170 rounded-3xl border border-neutral-300/70 bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden mask-b-from-40% mask-b-to-100% shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
        <div className="relative w-full h-full border bg-white/90 border-black/20 rounded-2xl shadow-lg overflow-hidden">
        <video
            src="https://keep-khaki-eta.vercel.app/assets/keepVideo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
        />
        </div>

    </div>

    {/*  Trusted section  */}
    <div className="container mx-auto mt-10">
        <TrustedSection />
    </div>

    </section>
  )
}


function InlineBadge({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-0.5
      rounded-md border border-white bg-white
      text-gray-700 text-sm font-medium
      whitespace-nowrap align-middle shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]">
      {icon}
      {label}
    </span>
  )
}



import { cn } from "@/lib/utils"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"
import Image from 'next/image'
import Link from 'next/link'
export function InteractiveGridPatternDemo() {
  return (
    <div className="bg-background relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
        width={20}
        height={20}
        squares={[80, 80]}
        squaresClassName="hover:fill-neutral-950"
      />
    </div>
  )
}
