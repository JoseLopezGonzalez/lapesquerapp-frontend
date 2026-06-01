'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Admin/Dashboard';
import OperarioDashboard from '@/components/Warehouse/OperarioDashboard';
import Loader from '@/components/Utilities/Loader';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role =
    session?.user?.role != null
      ? Array.isArray(session.user.role)
        ? session.user.role[0]
        : session.user.role
      : null;

  useEffect(() => {
    if (role === 'repartidor_autoventa') {
      router.replace('/field');
    }
  }, [role, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (role === 'operario') {
    const assignedStoreId = session?.user?.assignedStoreId ?? null;
    const storeId = assignedStoreId != null ? String(assignedStoreId) : null;
    return <OperarioDashboard storeId={storeId} />;
  }

  if (role === 'repartidor_autoventa') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <Dashboard />;
}
