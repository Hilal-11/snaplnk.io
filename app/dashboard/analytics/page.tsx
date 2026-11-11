import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import StatsOverview from "@/components/dashboard/main/StatsOverview";
import AnalyticsView from "@/components/dashboard/analytics/AnalyticsView";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { link } = await searchParams;
  const linkId = typeof link === "string" && link ? link : undefined;

  return (
    <div className="max-w-full mx-auto">
      {linkId && (
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <FiArrowLeft size={14} /> Back to links
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {linkId ? "Link analytics" : "Analytics"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {linkId
              ? "Clicks, locations and devices for this link."
              : "Track how your links, QR codes and bio pages perform."}
          </p>
        </div>
        {linkId && (
          <Link
            href="/dashboard/analytics"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
          >
            View all analytics
          </Link>
        )}
      </div>

      {!linkId && <StatsOverview />}
      <AnalyticsView linkId={linkId} />
    </div>
  );
}
