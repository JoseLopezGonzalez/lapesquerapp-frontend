'use client';

import { useRouter } from 'next/navigation';
import OperarioCreateReceptionForm from '@/components/Warehouse/OperarioCreateReceptionForm';
import ReceptionSuccessActions from '@/components/Warehouse/ReceptionSuccessActions';
import { RawMaterialReceptionsOptionsProvider } from '@/context/gestor-options/RawMaterialReceptionsOptionsContext';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Loader from '@/components/Utilities/Loader';

export default function OperatorReceptionsCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [createdReception, setCreatedReception] = useState(null);

  const storeId = session?.user?.assignedStoreId != null
    ? String(session.user.assignedStoreId)
    : null;

  const handleOnCreate = (reception) => {
    setCreatedReception(reception);
  };

  const handleExitSuccess = () => {
    setCreatedReception(null);
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
    <RawMaterialReceptionsOptionsProvider>
      <div className="w-full h-full flex flex-col flex-1 min-h-0">
        {createdReception ? (
          <ReceptionSuccessActions
            reception={createdReception}
            onExit={handleExitSuccess}
            createCeboHref={operatorRoutes.dispatchesCreate}
          />
        ) : (
          <OperarioCreateReceptionForm
            onSuccess={handleOnCreate}
            onCancel={() => router.push(operatorRoutes.dashboard)}
            storeId={storeId}
          />
        )}
      </div>
    </RawMaterialReceptionsOptionsProvider>
  );
}
