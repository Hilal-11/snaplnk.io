import React from 'react'
import { FaGithub, FaLinkedin, FaInstagram, FaGlobe } from "react-icons/fa";
import { SiLeetcode, SiX } from "react-icons/si";
import { FiLink, FiBarChart2, FiGrid, FiHome, FiShield } from "react-icons/fi";
import Link from "next/link"
export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Brand + tagline */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold text-neutral-800">Snaplnk.io</p>
            <p className="text-xs text-neutral-400 mt-0.5">Shorten Track Share smarter.</p>
          </div>

          {/* Center: Nav links */}
          <div className="flex items-center gap-5">
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
            <Link href="https://hilal-11.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="Website"><FaGlobe className="text-sm" /></Link>
            <Link href="https://github.com/hilal-11" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="GitHub"><FaGithub className="text-sm" /></Link>
            <Link href="https://x.com/Hilal3884871845" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="X"><SiX className="text-sm" /></Link>
            <Link href="https://www.linkedin.com/in/hilal-ahmad-ab5466347/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="LinkedIn"><FaLinkedin className="text-sm" /></Link>
            <Link href="https://leetcode.com/u/hilal-11/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="LeetCode"><SiLeetcode className="text-sm" /></Link>
            <Link href="https://www.instagram.com/hilal_11_n" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-all" title="Instagram"><FaInstagram className="text-sm" /></Link>
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
    </footer>
  )
}
