'use client';

import ComercialOrdersManager from '@/components/Comercial/CRM/ComercialOrdersManager';
import { OrdersManagerOptionsProvider } from '@/context/gestor-options/OrdersManagerOptionsContext';

export default function ComercialOrdersManagerPage() {
  return (
    <OrdersManagerOptionsProvider>
      <ComercialOrdersManager />
    </OrdersManagerOptionsProvider>
  );
}

