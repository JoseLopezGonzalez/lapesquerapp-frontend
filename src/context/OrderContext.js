// /src/context/OrderContext.js
'use client'
import React, { createContext, useContext } from 'react';
import { useOrder } from '@/hooks/useOrder';

// Creamos el contexto
const OrderContext = createContext();

// Componente proveedor del contexto
export function OrderProvider({ orderId, children ,onChange }) {
  // Se obtienen los datos del pedido utilizando el hook
  const orderData = useOrder(orderId , onChange);

  return (
    <OrderContext.Provider value={orderData}>
      {children}
    </OrderContext.Provider>
  );
}

// Hook para consumir el contexto fácilmente
export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}
