import { FiAlertCircle, FiCheckCircle, FiEyeOff, FiPauseCircle } from "react-icons/fi";
import type { LinkItem } from "./types";
import { getLinkStatus } from "./utils";

const STYLES = {
  active: { label: "Active", icon: FiCheckCircle, cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  disabled: { label: "Disabled", icon: FiPauseCircle, cls: "text-neutral-500 bg-neutral-50 border-neutral-200" },
  expired: { label: "Expired", icon: FiAlertCircle, cls: "text-orange-700 bg-orange-50 border-orange-100" },
  limit: { label: "Limit reached", icon: FiAlertCircle, cls: "text-orange-700 bg-orange-50 border-orange-100" },
  hidden: { label: "Hidden", icon: FiEyeOff, cls: "text-neutral-500 bg-neutral-100 border-neutral-200" },
} as const;

export default function StatusBadge({ link }: { link: LinkItem }) {
  const s = STYLES[getLinkStatus(link)];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md border px-1.5 py-0.5 ${s.cls}`}
    >
      <s.icon size={11} />
      {s.label}
    </span>
  );
}
