import Link from "next/link";
import { FiArrowUpRight, FiBarChart2, FiClock, FiGlobe, FiTag, FiUser } from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";

const FEATURES = [
  {
    href: "/dashboard/qr-codes",
    title: "QR Codes",
    description: "Every link gets a QR code. Download, share and track scans.",
    icon: TbQrcode,
  },
  {
    href: "/dashboard/analytics",
    title: "Analytics",
    description: "Clicks by day, country, device and browser — per link or overall.",
    icon: FiBarChart2,
  },
  {
    href: "/dashboard/bio-pages",
    title: "Bio Pages",
    description: "A link-in-bio page that holds all your links and socials.",
    icon: FiUser,
    badge: "New",
  },
  {
    href: "/dashboard/links",
    title: "Tags",
    description: "Organise links with tags and filter your library in a click.",
    icon: FiTag,
  },
  {
    href: "/dashboard/links",
    title: "Expiry & controls",
    description: "Set expiry dates, disable or hide links without deleting them.",
    icon: FiClock,
  },
  {
    href: null,
    title: "Custom domains",
    description: "Use your own branded domain for short links.",
    icon: FiGlobe,
    badge: "Soon",
  },
] as const;

export default function FeatureGrid() {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900">Do more with Snaplnk</p>
        <p className="text-xs text-neutral-400 mt-0.5">Everything included in your workspace</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FEATURES.map((f) => {
          const body = (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                  <f.icon size={16} />
                </span>
                {"badge" in f && f.badge ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      f.badge === "Soon" ? "bg-neutral-100 text-neutral-400" : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {f.badge}
                  </span>
                ) : (
                  <FiArrowUpRight
                    size={15}
                    className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-900">{f.title}</p>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{f.description}</p>
            </>
          );
          const cls =
            "group rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 transition-all";
          return f.href ? (
            <Link key={f.title} href={f.href} className={`${cls} hover:bg-white hover:border-neutral-300 hover:shadow-[0px_8px_24px_-12px_rgba(0,0,0,0.2)]`}>
              {body}
            </Link>
          ) : (
            <div key={f.title} className={`${cls} opacity-70 cursor-default`}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
