'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateReceptionForm from '@/components/Admin/RawMaterialReceptions/CreateReceptionForm';
import OperarioCreateReceptionForm from '@/components/Warehouse/OperarioCreateReceptionForm';
import ReceptionSuccessActions from '@/components/Warehouse/ReceptionSuccessActions';
import { Card, CardContent } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';

export default function CreateReceptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [createdReception, setCreatedReception] = useState(null);

  const role =
    session?.user?.role != null
      ? Array.isArray(session.user.role)
        ? session.user.role[0]
        : session.user.role
      : null;
  const isOperario = role === 'operario';
  const storeId =
    isOperario && session?.user?.assignedStoreId != null
      ? String(session.user.assignedStoreId)
      : null;

  const handleOnCreate = (reception) => {
    if (isOperario) {
      setCreatedReception(reception);
    } else {
      router.push(`/admin/raw-material-receptions/${reception.id}/edit`);
    }
  };

  const handleExitSuccess = () => {
    setCreatedReception(null);
    router.push('/admin/home');
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isOperario) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-6">
        {createdReception ? (
          <ReceptionSuccessActions reception={createdReception} onExit={handleExitSuccess} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <OperarioCreateReceptionForm
              onSuccess={handleOnCreate}
              onCancel={() => router.back()}
              storeId={storeId}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <CreateReceptionForm onSuccess={handleOnCreate} />
      </CardContent>
    </Card>
  );
}
