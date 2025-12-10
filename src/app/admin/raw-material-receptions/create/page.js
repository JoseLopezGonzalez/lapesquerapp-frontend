'use client'

import { useRouter } from 'next/navigation';
import CreateReceptionForm from "@/components/Admin/RawMaterialReceptions/CreateReceptionForm";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateReceptionPage() {
  const router = useRouter();

  const handleOnCreate = (reception) => {
    router.push(`/admin/raw-material-receptions/${reception.id}`);
  };

  return (
    <Card className='w-full h-full p-6'>
      <CardContent className='overflow-y-auto h-full'>
        <CreateReceptionForm onSuccess={handleOnCreate} />
      </CardContent>
    </Card>
  );
}

