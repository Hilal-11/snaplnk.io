"use client";

import React, { useState, useEffect } from "react";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { HEADER_CONFIG } from "@/config/headerConfig";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import SnapLnkButton from "../SnaplnkButton";
import HeaderAuthSection from "./HeaderAuthSection";
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

 
  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-[9999]
          bg-white transition-all duration-200
          ${scrolled
            ? "border-b border-neutral-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]"
            : "border-b border-neutral-300"}
        `}
      >
        <div className="container mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between lg:h-[60px] h-[52px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 select-none">
              <Image src={'/snaplinklogolight.svg'} alt="Keep logo" width={32} height={32} />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              {HEADER_CONFIG.map((item) => (
                <Link
                  key={item.id}
                  href={item.link ?? "#"}
                  className="px-3 py-1.5 rounded-md text-[14.5px] font-sans font-medium text-gray-500 hover:text-neutral-400 transition-colors duration-150 select-none"
                >
                  {item.header_title}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-1">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="relative inline-flex">
                <span className="absolute inset-0 rounded-[10px] animate-[ping_2.4s_ease_infinite] ring-0 ring-yellow-400/50" />
                <SnapLnkButton text="Start for free"/>
              </motion.div>
              <HeaderAuthSection/> 
            </div>

            {/* Mobile toggle — inside header which is z-[9999], always clickable */}
            <div className="flex items-center justify-center md:hidden">
              <div className="relative left-2"><HeaderAuthSection/></div> 
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <HiX size={18} /> : <HiMenuAlt3 size={18} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Backdrop — pure CSS, no Framer Motion, no z-index conflicts */}
      <div
        className="fixed inset-0 z-[9990] bg-black/10 backdrop-blur-[2px] md:hidden transition-opacity duration-200"
        style={{
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
        }}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer — pure CSS transition */}
      <div
        className="fixed left-0 right-0 z-[9995] md:hidden bg-white border-b border-gray-200 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] transition-all duration-200"
        style={{
          top: "52px",
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: menuOpen ? "auto" : "none",
        }}
      >
        <nav className="px-4 pt-3 pb-4 flex flex-col" aria-label="Mobile navigation">

          {HEADER_CONFIG.map((item) => (
            <Link
              key={item.id}
              href={item.link ?? "#"}
              className="flex items-center px-3 py-2.5 rounded-md text-[14px] font-sans font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
              onClick={() => setMenuOpen(false)}
            >
              {item.header_title}
            </Link>
          ))}

          {/* Mobile CTA */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center px-4 py-2.5 rounded-md text-[14px] font-sans font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
            >
              Sign up
            </Link>

            <SnapLnkButton text="Let's try keep"/>
          </div>

        </nav>
      </div>

      <div className="lg:h-[60px] h-[52px]" aria-hidden="true" />
    </>
  );
}