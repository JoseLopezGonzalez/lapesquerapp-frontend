'use client';

import { useState } from 'react';
import { type ComponentType } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OperarioCreateCeboFormJS from '@/components/Warehouse/OperarioCreateCeboForm';
import CeboSuccessActions from '@/components/Warehouse/CeboSuccessActions';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
import Loader from '@/components/Utilities/Loader';

interface CeboFormProps {
  onSuccess: (dispatch: Record<string, unknown>) => void;
  onCancel: () => void;
  initialSupplierId?: string | null;
}

// JS source file infers prop types from default values (null → null | undefined).
// This cast declares the actual accepted types without touching the legacy JS file.
const OperarioCreateCeboForm = OperarioCreateCeboFormJS as unknown as ComponentType<CeboFormProps>;

export default function OperatorDispatchesCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [createdDispatch, setCreatedDispatch] = useState<Record<string, unknown> | null>(null);

  const initialSupplierId = searchParams.get('supplierId') ?? null;

  const handleOnCreate = (dispatch: Record<string, unknown>) => {
    setCreatedDispatch(dispatch);
  };

  const handleExitSuccess = () => {
    setCreatedDispatch(null);
    router.push(operatorRoutes.dashboard);
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      {createdDispatch ? (
        <CeboSuccessActions
          dispatch={createdDispatch}
          onExit={handleExitSuccess}
        />
      ) : (
        <OperarioCreateCeboForm
          onSuccess={handleOnCreate}
          onCancel={() => router.push(operatorRoutes.dashboard)}
          initialSupplierId={initialSupplierId}
        />
      )}
    </div>
  );
}
