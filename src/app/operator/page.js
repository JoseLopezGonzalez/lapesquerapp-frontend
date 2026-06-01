'use client';

import { useSession } from 'next-auth/react';
import OperarioDashboard from '@/components/Warehouse/OperarioDashboard';
import Loader from '@/components/Utilities/Loader';

export default function OperatorDashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const storeId =
    session?.user?.assignedStoreId != null ? String(session.user.assignedStoreId) : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <OperarioDashboard storeId={storeId} />
    </div>
  );
}
