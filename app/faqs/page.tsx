import Link from "next/link";
import {
  FiZap,
  FiLink,
  FiBarChart2,
  FiShield,
  FiPlus,
  FiArrowRight,
  FiHelpCircle,
} from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa6";
import { HiOutlineExternalLink } from "react-icons/hi";
import Footer from "@/components/landing/Footer";
import SnapLnkButton from "@/components/SnaplnkButton";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import Header from "@/components/landing/Header";

const cardShadow =
  "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]";

const SECTIONS = [
  {
    icon: FiZap,
    title: "Getting Started",
    description: "Everything you need to hit the ground running.",
    faqs: [
      {
        q: "Is Snaplnk.io really free?",
        a: "Yes — 100% free, forever. Every feature including short links, QR codes, bio pages and analytics is included for every user. No paid tiers, no trials that expire, no credit card required.",
      },
      {
        q: "Do I need to create an account to shorten a link?",
        a: "You can shorten a link instantly from the homepage. Creating a free account lets you save, track, organize and manage all your links in one dashboard.",
      },
      {
        q: "How do I shorten my first link?",
        a: "Paste your long URL into the box on the homepage and hit “Short link”. Your short link is ready in seconds — share it anywhere.",
      },
      {
        q: "Can I use Snaplnk.io on mobile?",
        a: "Absolutely. Snaplnk.io is fully responsive, so the dashboard, link manager and analytics work great on any device.",
      },
    ],
  },
  {
    icon: FiLink,
    title: "Links & Customization",
    description: "Make every link yours — aliases, expiry and organization.",
    faqs: [
      {
        q: "Can I create custom aliases for my links?",
        a: "Yes. You can replace the auto-generated code with your own custom alias, slug or brand name — completely free and unlimited.",
      },
      {
        q: "Can I edit or update a link after creating it?",
        a: "Anytime. Change the destination URL, title, alias or tags from your dashboard without creating a new link.",
      },
      {
        q: "Do links ever expire?",
        a: "Your links stay active forever unless you choose to expire them. You can set auto-expiry on any link, or archive and restore them whenever you like.",
      },
      {
        q: "Can I organize my links?",
        a: "Yes — use tags to group links, filter by status, and move them between Active, Archived or Bin. Everything is at your fingertips in the dashboard.",
      },
    ],
  },
  {
    icon: FiBarChart2,
    title: "Analytics & QR Codes",
    description: "Track every click and generate QR codes, all free.",
    faqs: [
      {
        q: "What analytics do I get?",
        a: "Every link comes with total clicks, unique clicks, last-clicked activity and real-time click analytics — all free, with no tracking limits.",
      },
      {
        q: "Are QR codes really free?",
        a: "Yes. Generate an unlimited number of QR codes, one for every link, and download them to share anywhere.",
      },
      {
        q: "Can I track QR code scans?",
        a: "Every QR code points to a short link, so scans show up in your click analytics just like regular clicks.",
      },
      {
        q: "How fresh is the analytics data?",
        a: "Analytics update in real time. Clicks appear in your dashboard almost instantly after they happen.",
      },
    ],
  },
  {
    icon: FiShield,
    title: "Account & Platform",
    description: "Domains, teams, API access and rock-solid speed.",
    faqs: [
      {
        q: "Can I use my own custom domain?",
        a: "Yes. Connect your own domain and use it for your short links and bio pages for a fully branded experience.",
      },
      {
        q: "Can I use Snaplnk.io with my team?",
        a: "Teams are supported — invite collaborators, share links and manage everything together in one workspace.",
      },
      {
        q: "Is there a developer API?",
        a: "Yes. Generate API keys from your dashboard and integrate link shortening and management directly into your own apps and workflows.",
      },
      {
        q: "How fast are my links?",
        a: "Links redirect instantly on a fast, reliable infrastructure — so your audience never waits.",
      },
    ],
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between gap-5 py-4 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="text-[15px] font-medium font-sans text-neutral-600 leading-snug group-hover:text-neutral-900 group-open:text-neutral-900 transition-colors duration-200">
          {q}
        </span>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-open:bg-black transition-colors duration-200 flex-shrink-0">
          <FiPlus
            className="text-neutral-600 group-open:text-white group-open:rotate-45 transition-all duration-200"
            size={14}
          />
        </span>
      </summary>
      <p className="pb-5 pr-8 text-[14px] font-medium text-neutral-500 leading-relaxed">
        {a}
      </p>
    </details>
  );
}

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

        <div className="relative z-10 container mx-auto max-w-7xl">
          {/* Heading */}
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex justify-center mt-8 mb-10">
              <span
                className={`relative inline-flex items-center gap-2 overflow-hidden bg-neutral-100 border border-neutral-50 rounded-full pl-2 pr-4 h-7.5 w-72 ${cardShadow}`}
              >
                <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black flex-shrink-0">
                  <HiOutlineExternalLink className="text-neutral-100 text-xs" />
                </span>

                <span className="text-xs font-medium text-neutral-900 tracking-wide whitespace-nowrap">
                  Got questions? We&apos;ve got answers
                </span>

                <span className="absolute right-0 h-10 w-8 bg-black text-[10px] font-semibold text-white uppercase tracking-widest whitespace-nowrap flex justify-center items-center">
                  <FaLocationArrow size={17} />
                </span>
              </span>
            </div>

            <h1 className="text-2xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Frequently asked{" "}
              <span className="relative inline-block">
                <span className="relative z-10">questions</span>
              </span>
            </h1>

            <p className="mt-6 font-sans font-medium text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto text-center">
              Everything you need to know about Snaplnk.io — free forever,
              unlimited links, and no surprises. Can&apos;t find what
              you&apos;re looking for? Ask us anytime.
            </p>
          </div>

          {/* ---- FAQ sections: 2/2 grid ---- */}
          <div className="mt-16 space-y-16">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                {/* Section header — left aligned */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black flex-shrink-0">
                    <section.icon className="text-white text-sm" />
                  </span>
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <p className="ml-11 mb-6 text-sm font-normal text-neutral-400">
                  {section.description}
                </p>

                {/* 2 columns of FAQs — per-column dividers stay aligned */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-0 text-left">
                  <div className="border-t border-neutral-200/70 divide-y divide-neutral-200/70">
                    {section.faqs.slice(0, 2).map((faq) => (
                      <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                  <div className="border-t border-neutral-200/70 divide-y divide-neutral-200/70">
                    {section.faqs.slice(2, 4).map((faq) => (
                      <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ---- Bottom CTA ---- */}
          <div className="mt-20 flex flex-col items-center gap-4">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-black mb-1">
              <FiHelpCircle className="text-white text-base" />
            </span>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Still have questions?
            </h2>
            <p className="text-sm font-medium text-neutral-500 max-w-md text-center">
              We&apos;re happy to help. Start free and explore — or reach out
              and we&apos;ll get back to you.
            </p>
            <div className="w-60 mt-2">
              <SnapLnkButton text="Get started — it's free" />
            </div>
            <Link
              href="/pricing"
              className="group flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              See what&apos;s included in the free plan
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
