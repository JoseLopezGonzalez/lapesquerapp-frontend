'use client'

import { useRouter } from 'next/navigation';
import CreateOrderForm from "@/components/Admin/OrdersManager/CreateOrderForm";
import { Card, CardContent } from "@/components/ui/card";

export default function CreatePage() {
  const router = useRouter();

  const handleOnCreate = (orderId) => {
    router.push(`/admin/orders/${orderId}`);
  };

  return (
    <Card className='w-full h-full p-6 '>
      <CardContent className='overflow-y-auto h-full'>
        <CreateOrderForm onCreate={handleOnCreate} />
      </CardContent>
    </Card>
  );
}
