"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/Admin/Dashboard";
import OperarioDashboard from "@/components/Warehouse/OperarioDashboard";
import Loader from "@/components/Utilities/Loader";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  const role = session?.user?.role != null
    ? (Array.isArray(session.user.role) ? session.user.role[0] : session.user.role)
    : null;

  if (role === "operario") {
    const assignedStoreId = session?.user?.assignedStoreId ?? null;
    const storeId = assignedStoreId != null ? String(assignedStoreId) : null;
    return <OperarioDashboard storeId={storeId} />;
  }

  return <Dashboard />;
}
