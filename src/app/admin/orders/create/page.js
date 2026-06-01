'use client';

import { useRouter } from 'next/navigation';
import CreateOrderForm from '@/components/Admin/OrdersManager/CreateOrderForm';
import { Card, CardContent } from '@/components/ui/card';

export default function CreatePage() {
  const router = useRouter();

  const handleOnCreate = (orderId) => {
    router.push(`/admin/orders/${orderId}`);
  };

  return (
    <Card className="h-full w-full p-6">
      <CardContent className="h-full overflow-y-auto">
        <CreateOrderForm onCreate={handleOnCreate} />
      </CardContent>
    </Card>
  );
}
