import { FiGithub, FiInstagram, FiLinkedin, FiTwitter } from "react-icons/fi";

/** Decorative phone preview of a bio page. */
export default function BioPhoneMock({
  name = "Your Name",
  bio = "Creator · Developer · Builder",
  links = ["My portfolio", "Latest project", "Book a call"],
}: {
  name?: string;
  bio?: string;
  links?: string[];
}) {
  return (
    <div className="w-[240px] rounded-[2.2rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.3)]">
      <div className="rounded-[1.75rem] bg-gradient-to-b from-neutral-100 to-white px-5 pt-8 pb-7 min-h-[420px] flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xl font-bold">
          {(name.trim()[0] ?? "Y").toUpperCase()}
        </div>
        <p className="mt-3 text-sm font-bold text-neutral-900 text-center truncate max-w-full">{name || "Your Name"}</p>
        <p className="text-[11px] text-neutral-500 text-center line-clamp-2">{bio}</p>
        <div className="flex gap-2.5 mt-3 text-neutral-700">
          <FiInstagram size={14} />
          <FiTwitter size={14} />
          <FiLinkedin size={14} />
          <FiGithub size={14} />
        </div>
        <div className="w-full mt-5 space-y-2">
          {links.map((l, i) => (
            <div
              key={i}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 text-center text-xs font-semibold text-neutral-800 shadow-sm truncate px-2"
            >
              {l || "Link title"}
            </div>
          ))}
        </div>
        <p className="mt-auto pt-6 text-[10px] font-medium text-neutral-400">snaplnk.io</p>
      </div>
    </div>
  );
}
