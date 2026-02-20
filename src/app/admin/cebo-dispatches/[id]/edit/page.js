'use client';

import { useParams, useRouter } from 'next/navigation';
import EditCeboForm from '@/components/Admin/CeboDispatches/EditCeboForm';
import { Card, CardContent } from '@/components/ui/card';

export default function EditCeboDispatchPage() {
  const params = useParams();
  const router = useRouter();
  const dispatchId = params.id;

  const handleOnSuccess = (updated) => {
    if (updated?.id) {
      router.push(`/admin/cebo-dispatches/${updated.id}/edit`);
    }
  };

  return (
    <Card className="w-full h-full p-6">
      <CardContent className="overflow-y-auto h-full">
        <EditCeboForm dispatchId={dispatchId} onSuccess={handleOnSuccess} />
      </CardContent>
    </Card>
  );
}
