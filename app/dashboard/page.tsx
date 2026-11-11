import DashboardGreeting from "@/components/dashboard/main/DashboardGreeting";
import QuickCreate from "@/components/dashboard/main/QuickCreate";
import FeatureGrid from "@/components/dashboard/main/FeatureGrid";
import RecentLinksCard from "@/components/dashboard/main/RecentLinksCard";

// The home view stays focused on creating links. Stats and charts live on /dashboard/analytics.
export default function DashboardPage() {
  return (
    <div>
      <DashboardGreeting />
      <QuickCreate />

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-6">
        <div className="lg:col-span-7">
          <FeatureGrid />
        </div>
        <div className="lg:col-span-3">
          <RecentLinksCard />
        </div>
      </div>
    </div>
  );
}
