'use client';

import OrdersManager from '@/components/Admin/OrdersManager';
import { OrdersManagerOptionsProvider } from '@/context/gestor-options/OrdersManagerOptionsContext';

export default function OrdersManagerPageClient() {
  return (
    <OrdersManagerOptionsProvider>
      <OrdersManager />
    </OrdersManagerOptionsProvider>
  );
}
