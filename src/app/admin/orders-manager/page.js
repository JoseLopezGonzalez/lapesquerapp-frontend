'use client';

import OrdersManager from "@/components/Admin/OrdersManager";
import { OrdersManagerOptionsProvider } from "@/context/gestor-options/OrdersManagerOptionsContext";

export default function OrdersManagerPage() {
  return (
    <OrdersManagerOptionsProvider>
      <OrdersManager />
    </OrdersManagerOptionsProvider>
  );
}
