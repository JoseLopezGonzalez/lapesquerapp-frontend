import DashboardCards from "@/components/Superadmin/DashboardCards";
import AlertsWidget from "@/components/Superadmin/AlertsWidget";
import QueueHealthWidget from "@/components/Superadmin/QueueHealthWidget";
import ActivityFeed from "@/components/Superadmin/ActivityFeed";
import ActiveSessionsBanner from "@/components/Superadmin/ActiveSessionsBanner";

export default function SuperadminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActiveSessionsBanner />
          <DashboardCards />
          <AlertsWidget />
          <QueueHealthWidget />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
