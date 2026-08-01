import Link from "next/link";
import {
  FiLink,
  FiBarChart2,
  FiGrid,
  FiShield,
  FiCheck,
  FiArrowRight,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { IoInfiniteSharp } from "react-icons/io5";
import { FaLocationArrow } from "react-icons/fa6";
import { HiOutlineExternalLink } from "react-icons/hi";
import Footer from "@/components/landing/Footer";
import SnapLnkButton from "@/components/SnaplnkButton";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import Header from "@/components/landing/Header";

const cardShadow =
  "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]";

const CATEGORIES = [
  {
    icon: FiLink,
    title: "Links",
    items: [
      "Unlimited short links",
      "Custom aliases & slugs",
      "Edit links anytime",
      "Auto-expiring links",
      "Archive, restore & bin",
    ],
  },
  {
    icon: FiBarChart2,
    title: "Analytics",
    items: [
      "Total & unique click tracking",
      "Real-time click analytics",
      "Last-clicked activity",
      "Copy links in one click",
    ],
  },
  {
    icon: FiGrid,
    title: "QR Codes & Bio",
    items: [
      "Unlimited QR codes",
      "A QR code for every link",
      "Bio pages",
      "Download & share anywhere",
    ],
  },
  {
    icon: FiShield,
    title: "Platform",
    items: [
      "Custom domains",
      "Teams & collaboration",
      "API keys & developer API",
      "Tags to organize links",
      "Fast, reliable redirects",
    ],
  },
] as const;

const STATS = [
  {
    icon: FiZap,
    value: "100%",
    label: "Free — forever",
  },
  {
    icon: IoInfiniteSharp,
    value: "Unlimited",
    label: "links, QR codes & clicks",
  },
  {
    icon: FiShield,
    value: "$0",
    label: "credit card required",
  },
  {
    icon: FiUsers,
    value: "Everyone",
    label: "built for you",
  },
] as const;

export default function Page() {
  return (
    <div>
        <Header />
      <section className="relative font-sans w-full overflow-hidden px-4 lg:pt-12 pb-20">
        {/* Grid pattern background */}
        <div
          className="pointer-events-none absolute top-0 left-0 w-[480px] h-[480px] lg:w-[840px] lg:h-[740px] z-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 30%, transparent 85%), linear-gradient(to right, transparent 0%, black 15%, black 30%, transparent 85%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 15%, black 30%, transparent 85%), linear-gradient(to right, transparent 0%, black 15%, black 30%, transparent 85%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
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

        <div className="relative z-10 container mx-auto max-w-5xl text-center">
          {/* Top Badge */}
          <div className="flex justify-center mt-8 mb-10">
            <span
              className={`relative inline-flex items-center gap-2 overflow-hidden bg-neutral-100 border border-neutral-50 rounded-full pl-2 pr-4 h-7.5 w-72 ${cardShadow}`}
            >
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black flex-shrink-0">
                <HiOutlineExternalLink className="text-neutral-100 text-xs" />
              </span>

              <span className="text-xs font-medium text-neutral-900 tracking-wide whitespace-nowrap">
                One plan. Everything free.
              </span>

              <span className="absolute right-0 h-10 w-8 bg-black text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap flex justify-center items-center">
                <FaLocationArrow size={17} />
              </span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Simple pricing —{" "}
            <span className="relative inline-block">
              <span className="relative z-10">$0 forever</span>
            </span>
            . No surprises.
          </h1>

          <p className="mt-6 font-sans font-medium text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto text-center">
            Snaplnk.io is completely free. Every feature — short links, QR
            codes, bio pages, analytics and more — is included for everyone.
            No paywalls, no limits, no catch.
          </p>

          {/* ---- Single pricing card ---- */}
          <div className="mt-12 max-w-3xl mx-auto rounded-3xl border border-neutral-300/70 bg-gradient-to-br from-neutral-50 to-neutral-100 p-2 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
            <div className="relative w-full border bg-white/95 border-black/20 rounded-2xl shadow-lg overflow-hidden px-6 py-10 lg:px-12 lg:py-12">
              {/* plan label pill */}
              <div className="flex justify-center mb-8">
                <span
                  className={`inline-flex items-center gap-2 rounded-full bg-neutral-100 border border-neutral-200 pl-1.5 pr-4 py-1 ${cardShadow}`}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black flex-shrink-0">
                    <FiZap className="text-white text-[10px]" />
                  </span>
                  <span className="text-xs font-semibold text-neutral-900 tracking-wide">
                    The Free Plan
                  </span>
                </span>
              </div>

              {/* price */}
              <div className="flex items-end justify-center gap-3">
                <span className="text-7xl lg:text-8xl font-bold text-gray-900 tracking-tight leading-none">
                  $0
                </span>
                <span className="pb-2 text-sm font-medium text-neutral-400">
                  forever
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-neutral-500 max-w-md mx-auto">
                Everything Snaplnk.io offers — included for every user, free
                forever. No trials that end, no upgraded tiers.
              </p>

              {/* CTA */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="w-60">
                  <SnapLnkButton text="Start for free" />
                </div>
                <p className="text-xs text-neutral-400">
                  No credit card required · No hidden fees · Cancel anytime
                </p>
              </div>
            </div>
          </div>

          {/* ---- Everything included ---- */}
          <div className="mt-16">
            <div className="flex justify-center mb-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                <FiCheck className="text-black" size={14} />
                Everything is included
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  className="text-left rounded-2xl border border-neutral-200/80 bg-white p-6 hover:border-neutral-300 transition-colors duration-200 shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_4px_12px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-black text-white">
                      <cat.icon className="text-sm" />
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {cat.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13px] font-medium text-neutral-600"
                      >
                        <span className="mt-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-100 flex-shrink-0">
                          <FiCheck className="text-black text-[9px]" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Black stats band ---- */}
          <div className="mt-16 rounded-3xl bg-black text-white px-6 py-10 lg:px-12 overflow-hidden relative">
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8">
              {STATS.map((stat) => (
                <div key={stat.value} className="text-center">
                  <stat.icon className="mx-auto text-neutral-400 text-lg mb-2" />
                  <p className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-neutral-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Bottom CTA ---- */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Ready to share smarter?
            </h2>
            <p className="text-sm font-medium text-neutral-500 max-w-md">
              Shorten your first link in seconds — it&apos;s free, and it
              always will be.
            </p>
            <div className="w-60 mt-2">
              <SnapLnkButton text="Get started — it's free" />
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Explore the dashboard
              <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto">
        <Footer />
      </div>
    </div>
  );
}
