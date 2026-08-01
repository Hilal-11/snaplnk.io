import {
  TbBolt,
  TbLink,
  TbInfinity,
  TbCopy,
  TbEdit,
  TbClock,
  TbTag,
  TbArchive,
  TbLock,
  TbWorld,
  TbChartBar,
  TbTrendingUp,
  TbQrcode,
  TbDownload,
  TbDeviceMobile,
  TbRadar,
  TbUsers,
  TbKey,
  TbShieldCheck,
  TbCreditCard,
} from "react-icons/tb";
import type { IconType } from "react-icons";

const features = [
  {
    name: "One-click",
    icon: TbBolt,
  },
  {
    name: "Aliases",
    icon: TbLink,
  },
  {
    name: "Unlimited",
    icon: TbInfinity,
  },
  {
    name: "Quick copy",
    icon: TbCopy,
  },
  {
    name: "Edit links",
    icon: TbEdit,
  },
  {
    name: "Expiry",
    icon: TbClock,
  },
  {
    name: "Tags",
    icon: TbTag,
  },
  {
    name: "Archive",
    icon: TbArchive,
  },
  {
    name: "Secure",
    icon: TbLock,
  },
  {
    name: "Domains",
    icon: TbWorld,
  },
];

const usage = [
  {
    name: "Analytics",
    icon: TbChartBar,
  },
  {
    name: "Live stats",
    icon: TbTrendingUp,
  },
  {
    name: "QR codes",
    icon: TbQrcode,
  },
  {
    name: "Downloads",
    icon: TbDownload,
  },
  {
    name: "Bio pages",
    icon: TbDeviceMobile,
  },
  {
    name: "Tracking",
    icon: TbRadar,
  },
  {
    name: "Teams",
    icon: TbUsers,
  },
  {
    name: "API keys",
    icon: TbKey,
  },
  {
    name: "Free forever",
    icon: TbShieldCheck,
  },
  {
    name: "No card",
    icon: TbCreditCard,
  },
];

function FeatureCell({ name, icon: Icon }: { name: string; icon: IconType }) {
  return (
    <div className="group flex items-center gap-2 justify-center px-2 py-[28px]
  border-b border-black/[0.06]
  lg:border-r border-black/[0.06]
  
  [&:nth-last-child(-n+2)]:border-b-0
  sm:[&:nth-child(2n)]:border-r
  sm:[&:nth-child(5n)]:border-r-0
  sm:[&:nth-last-child(-n+2)]:border-b
  sm:[&:nth-last-child(-n+5)]:border-b-0">
      <Icon className="h-5 w-5 text-gray-400 opacity-80 group-hover:text-gray-800 group-hover:opacity-100 transition-all duration-200" />
      <span className="text-[14px] font-sans font-semibold text-gray-500 tracking-tight whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}

function TrustedSection() {
  return (
    <section className="max-w-7xl mx-auto font-sans py-10 h-auto overflow-hidden">
      <p className="text-center text-[14px] text-gray-400 mb-6">
        Everything you need to shorten, track &amp; share —{" "}
        <strong className="text-gray-500 font-sans font-medium">free forever</strong>
      </p>

      <div className="grid grid-cols-[1fr_1px_1fr] border-t border-b border-black/[0.06]">

        {/* Features col */}
        <div className="px-2 lg:px-8">
          <div className="flex flex-wrap justify-center -mt-[11px]">
            <span className="text-sm border border-yellow-400 text-neutral-900 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] px-3 py-0.5 rounded-md">
              Features
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
            {features.map(({ name, icon }) => <FeatureCell key={name} name={name} icon={icon} />)}
          </div>
        </div>

        {/* Divider */}
        <div className="bg-black/[0.06]" />

        {/* Usage col */}
        <div className="px-8">
          <div className="flex flex-wrap justify-center -mt-[11px]">
            <span className="text-sm border border-yellow-400 text-neutral-900 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] px-3 py-0.5 rounded-md">
              Usage
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
            {usage.map(({ name, icon }) => <FeatureCell key={name} name={name} icon={icon} />)}
          </div>
        </div>

      </div>
    </section>
  )
}
export default TrustedSection
