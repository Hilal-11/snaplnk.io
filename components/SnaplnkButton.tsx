import Logo from "@/components/Logo";
import React from 'react'
import Link from 'next/link'
import { IoIosArrowRoundForward } from 'react-icons/io'
function SnapLnkButton({ text }: { text: string }) {
  return (
    <div>
      <Link
              href="/dashboard"
              className="group relative flex items-center overflow-hidden w-full pl-[5px] py-[4px] rounded-[10px] btn-primary"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,.35)_50%,transparent_70%)] group-hover:animate-[shimmer_.5s_ease_forwards]" />
                <Logo size={24} alt="" inverse />
              <span className="flex flex-1 items-center justify-center overflow-hidden px-2 pl-2">
                <span className="flex items-center gap-1 transition-transform duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)] group-hover:-translate-x-1.5">
                  <span className="text-sm font-medium tracking-tight text-white whitespace-nowrap">{text}</span>
                  <span className="translate-x-[-6px] opacity-0 transition-all duration-[220ms] group-hover:translate-x-0 group-hover:opacity-100">
                    <IoIosArrowRoundForward className="text-white text-lg" />
                  </span>
                </span>
              </span>
            </Link>
    </div>
  )
}

export default SnapLnkButton