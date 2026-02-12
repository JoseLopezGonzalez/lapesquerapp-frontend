'use client'

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateReceptionForm from "@/components/Admin/RawMaterialReceptions/CreateReceptionForm";
import OperarioCreateReceptionForm from "@/components/Warehouse/OperarioCreateReceptionForm";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/Utilities/Loader";

export default function CreateReceptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const role = session?.user?.role != null
    ? (Array.isArray(session.user.role) ? session.user.role[0] : session.user.role)
    : null;
  const isOperario = role === 'operario';
  const storeId = isOperario && session?.user?.assignedStoreId != null
    ? String(session.user.assignedStoreId)
    : null;

  const handleOnCreate = (reception) => {
    if (isOperario) {
      router.push('/admin/home');
    } else {
      router.push(`/admin/raw-material-receptions/${reception.id}/edit`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <Card className='w-full h-full flex flex-col overflow-hidden'>
      <CardContent
        className={
          isOperario
            ? 'flex flex-col flex-1 min-h-0 overflow-hidden p-6'
            : 'flex flex-col flex-1 min-h-0 overflow-y-auto p-6'
        }
      >
        {isOperario ? (
          <div className='flex-1 min-h-0 flex flex-col'>
            <OperarioCreateReceptionForm
            onSuccess={handleOnCreate}
            onCancel={() => router.back()}
            storeId={storeId}
          />
          </div>
        ) : (
          <CreateReceptionForm onSuccess={handleOnCreate} />
        )}
      </CardContent>
    </Card>
  );
}

