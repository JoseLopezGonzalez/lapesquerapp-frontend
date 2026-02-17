'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateReceptionForm from "@/components/Admin/RawMaterialReceptions/CreateReceptionForm";
import OperarioCreateReceptionForm from "@/components/Warehouse/OperarioCreateReceptionForm";
import ReceptionSuccessActions from "@/components/Warehouse/ReceptionSuccessActions";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/Utilities/Loader";

export default function CreateReceptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [createdReception, setCreatedReception] = useState(null);

  const role = session?.user?.role != null
    ? (Array.isArray(session.user.role) ? session.user.role[0] : session.user.role)
    : null;
  const isOperario = role === 'operario';
  const storeId = isOperario && session?.user?.assignedStoreId != null
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
      <div className="w-full min-h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isOperario) {
    return (
      <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden p-6">
        {createdReception ? (
          <ReceptionSuccessActions
            reception={createdReception}
            onExit={handleExitSuccess}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
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
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardContent className="flex flex-col flex-1 min-h-0 overflow-y-auto p-6">
        <CreateReceptionForm onSuccess={handleOnCreate} />
      </CardContent>
    </Card>
  );
}

