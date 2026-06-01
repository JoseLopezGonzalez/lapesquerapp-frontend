'use client';

import { useParams } from 'next/navigation';
import Order from '@/components/Admin/OrdersManager/Order';

export default function ComercialOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden p-2">
      <Order orderId={orderId} readOnly />
    </div>
  );
}
