import React from 'react'
import { FaGithub, FaLinkedin, FaInstagram, FaGlobe } from "react-icons/fa";
import { SiLeetcode, SiX } from "react-icons/si";
import { FiLink, FiBarChart2, FiGrid, FiHome, FiShield } from "react-icons/fi";
import Link from "next/link"
import Image from 'next/image';
export default function Footer() {
  return (
    <footer className="relative border-t border-neutral-200 bg-white mt-20 h-90">
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Brand + tagline */}
          <div className="text-center lg:text-left flex gap-2 items-center">
            <Image src="/snaplinklogolight.svg" alt="alt" width={30} height={30} />
            <p className="text-2xl font-semibold text-neutral-800">Snaplnk.io</p>
          </div>

          {/* Center: Nav links */}
          <div className="flex items-center gap-5 flex-wrap px-3 justify-center">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
              <FiHome className="text-sm" /> Dashboard
            </Link>
            <Link href="/dashboard/links" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
              <FiLink className="text-sm" /> Links
            </Link>
            <Link href="/dashboard/analytics" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
              <FiBarChart2 className="text-sm" /> Analytics
            </Link>
            <Link href="/dashboard/qr-codes" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
              <FiGrid className="text-sm" /> QR Codes
            </Link>
            <Link href="/privacy" className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
              <FiShield className="text-sm" /> Privacy
            </Link>
          </div>

          {/* Right: Social */}
          <div className="flex items-center gap-3">
            <Link href="https://hilal-11.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="Website"><FaGlobe className="text-sm" /></Link>
            <Link href="https://github.com/hilal-11" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="GitHub"><FaGithub className="text-sm" /></Link>
            <Link href="https://x.com/Hilal3884871845" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="X"><SiX className="text-sm" /></Link>
            <Link href="https://www.linkedin.com/in/hilal-ahmad-ab5466347/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="LinkedIn"><FaLinkedin className="text-sm" /></Link>
            <Link href="https://leetcode.com/u/hilal-11/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="LeetCode"><SiLeetcode className="text-sm" /></Link>
            <Link href="https://www.instagram.com/hilal_11_n" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 border text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="Instagram"><FaInstagram className="text-sm" /></Link>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-400">
            Built by <a href="https://github.com/hilal-11" target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-500 hover:text-neutral-700">Hilal Ahmad</a> · Powered by{" "}
            <Link href="https://lokalhost-io-i2di.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-500 hover:text-neutral-700">lokalhost.io</Link>
          </p>
        </div>
      </div>
      {/* Giant watermark — bottom center, edges masked, blurred glow, bottom 20% cropped */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden">
        <h1
          aria-hidden="true"
          className="translate-y-[20%] select-none whitespace-nowrap text-[4.5rem]  lg:text-[14rem] font-sans font-bold leading-none tracking-tight
          bg-gradient-to-b from-neutral-900/90 via-neutral-500/60 to-neutral-500/15 bg-clip-text text-transparent
          [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]
          [WebkitMaskImage:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
        >
          Snaplnk.io
        </h1>
      </div>
    </footer>
  )
}
