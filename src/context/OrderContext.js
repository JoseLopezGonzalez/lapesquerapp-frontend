// /src/context/OrderContext.js
'use client'
import React, { createContext, useContext, useMemo, useRef, useCallback } from 'react';
import { useOrder } from '@/hooks/useOrder';

// Creamos el contexto
const OrderContext = createContext();

// Componente proveedor del contexto
export function OrderProvider({ orderId, children, onChange }) {
  // Memoizar onChange para evitar que cambie la referencia en cada render
  const onChangeRef = useRef(onChange);
  
  // Actualizar la referencia cuando onChange cambie
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Crear una función estable que siempre use la última versión de onChange
  const stableOnChange = useCallback((updatedOrder = null) => {
    if (onChangeRef.current) {
      onChangeRef.current(updatedOrder);
    }
  }, []);

  // Se obtienen los datos del pedido utilizando el hook
  const orderData = useOrder(orderId, stableOnChange);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => orderData, [orderData]);

  return (
    <OrderContext.Provider value={contextValue}>
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
