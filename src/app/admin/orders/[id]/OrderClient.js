'use client';

import Order from '@/components/Admin/OrdersManager/Order';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobileSafe } from '@/hooks/use-mobile';

const OrderClient = ({ orderId }) => {
  const router = useRouter();
  const { isMobile, mounted } = useIsMobileSafe();

  const handleClose = () => {
    router.back();
  };

  if (!mounted) return null;

  return (
    <div className="h-full w-full overflow-hidden rounded-xl">
      <Order
        orderId={orderId}
        onClose={isMobile ? handleClose : undefined}
        isMobileOverride={isMobile}
      />
    </div>
  );
};

export default OrderClient;
