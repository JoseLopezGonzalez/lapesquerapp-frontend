import Link from "next/link";
import DashboardCards from "@/components/Superadmin/DashboardCards";
import AlertsWidget from "@/components/Superadmin/AlertsWidget";
import QueueHealthWidget from "@/components/Superadmin/QueueHealthWidget";
import ActivityFeed from "@/components/Superadmin/ActivityFeed";
import ActiveSessionsBanner from "@/components/Superadmin/ActiveSessionsBanner";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

export default function SuperadminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/superadmin/tenants/new">
              <Plus className="h-4 w-4" />
              Crear tenant
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/superadmin/tenants">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
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
