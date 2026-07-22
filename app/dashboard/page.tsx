import DashboardGreeting from "@/components/dashboard/main/DashboardGreeting";
import StatsOverview from "@/components/dashboard/main/StatsOverview";
import CreateLinkCard from "@/components/dashboard/main/CreateLinkCard";
import AnalyticsChart from "@/components/dashboard/main/AnalyticsChart";
import RecentLinksCard from "@/components/dashboard/main/RecentLinksCard";
import LinksTable from "@/components/dashboard/main/LinksTable";

export default function DashboardPage() {
  return (
    <div>
      <DashboardGreeting />
      <StatsOverview />
      <CreateLinkCard />

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-6">
        <div className="lg:col-span-7">
          <AnalyticsChart />
        </div>
        <div className="lg:col-span-3">
          <RecentLinksCard />
        </div>
      </div>

      <LinksTable />
    </div>
  );
}