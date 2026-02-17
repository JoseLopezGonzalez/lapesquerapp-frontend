'use client';

import { useSession } from 'next-auth/react';
import OperarioDashboard from '@/components/Warehouse/OperarioDashboard';
import Loader from '@/components/Utilities/Loader';

export default function OperatorDashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  const storeId = session?.user?.assignedStoreId != null
    ? String(session.user.assignedStoreId)
    : null;

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0">
      <OperarioDashboard storeId={storeId} />
    </div>
  );
}
