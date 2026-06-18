'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateCeboForm from '@/components/Admin/CeboDispatches/CreateCeboForm';
import OperarioCreateCeboForm from '@/components/Warehouse/OperarioCreateCeboForm';
import CeboSuccessActions from '@/components/Warehouse/CeboSuccessActions';
import { Card, CardContent } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';

export default function CreateCeboDispatchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [createdDispatch, setCreatedDispatch] = useState(null);

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

  const handleOnCreate = (dispatch) => {
    if (isOperario) {
      setCreatedDispatch(dispatch);
    } else {
      router.push(`/admin/cebo-dispatches/${dispatch.id}/edit`);
    }
  };

  const handleExitSuccess = () => {
    setCreatedDispatch(null);
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
        {createdDispatch ? (
          <CeboSuccessActions
            dispatch={createdDispatch}
            onExit={handleExitSuccess}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <OperarioCreateCeboForm
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
        <CreateCeboForm onSuccess={handleOnCreate} />
      </CardContent>
    </Card>
  );
}
