// /src/context/OrderContext.js
import React, { createContext, useContext } from 'react';
import { useOrder } from '@/hooks/useOrder';

// Creamos el contexto
const OrderContext = createContext();

// Componente proveedor del contexto
export function OrderProvider({ orderId, children }) {
  // Se obtienen los datos del pedido utilizando el hook
  const orderData = useOrder(orderId);

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
