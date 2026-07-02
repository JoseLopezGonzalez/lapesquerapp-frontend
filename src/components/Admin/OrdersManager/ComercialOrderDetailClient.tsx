'use client';

import Order from '@/components/Admin/OrdersManager/Order';

interface ComercialOrderDetailClientProps {
  orderId: string;
}

export default function ComercialOrderDetailClient({ orderId }: ComercialOrderDetailClientProps) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden p-2">
      <Order orderId={orderId} readOnly canViewCostData={false} />
    </div>
  );
}
