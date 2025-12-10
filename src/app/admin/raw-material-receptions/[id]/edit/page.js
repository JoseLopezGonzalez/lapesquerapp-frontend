'use client'

import { useParams, useRouter } from 'next/navigation';
import EditReceptionForm from "@/components/Admin/RawMaterialReceptions/EditReceptionForm";
import { Card, CardContent } from "@/components/ui/card";

export default function EditReceptionPage() {
  const params = useParams();
  const router = useRouter();
  const receptionId = params.id;

  const handleOnUpdate = (reception) => {
    router.push(`/admin/raw-material-receptions/${reception.id}/edit`);
  };

  return (
    <Card className='w-full h-full p-6'>
      <CardContent className='overflow-y-auto h-full'>
        <EditReceptionForm receptionId={receptionId} onSuccess={handleOnUpdate} />
      </CardContent>
    </Card>
  );
}

