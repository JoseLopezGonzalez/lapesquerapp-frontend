'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OperarioCreateCeboForm from '@/components/Warehouse/OperarioCreateCeboForm';
import CeboSuccessActions from '@/components/Warehouse/CeboSuccessActions';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
import Loader from '@/components/Utilities/Loader';

export default function OperatorDispatchesCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [createdDispatch, setCreatedDispatch] = useState(null);

  const storeId = session?.user?.assignedStoreId != null
    ? String(session.user.assignedStoreId)
    : null;

  const handleOnCreate = (dispatch) => {
    setCreatedDispatch(dispatch);
  };

  const handleExitSuccess = () => {
    setCreatedDispatch(null);
    router.push(operatorRoutes.dashboard);
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0">
      {createdDispatch ? (
        <CeboSuccessActions
          dispatch={createdDispatch}
          onExit={handleExitSuccess}
          onNew={() => setCreatedDispatch(null)}
        />
      ) : (
        <OperarioCreateCeboForm
          onSuccess={handleOnCreate}
          onCancel={() => router.push(operatorRoutes.dashboard)}
          storeId={storeId}
        />
      )}
    </div>
  );
}
