'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useOrder } from '@/hooks/useOrder';

type OrderContextValue = ReturnType<typeof useOrder>;
type OrderContextOrder = NonNullable<OrderContextValue['order']>;

const OrderContext = createContext<OrderContextValue | null>(null);

interface OrderProviderProps {
  orderId: number | string | null | undefined;
  children: ReactNode;
  onChange?: (updatedOrder: OrderContextOrder) => void;
  canViewCostData?: boolean;
}

export function OrderProvider({
  orderId,
  children,
  onChange,
  canViewCostData = true,
}: OrderProviderProps) {
  // Memoizar onChange para evitar que cambie la referencia en cada render
  const onChangeRef = useRef(onChange);

  // Actualizar la referencia cuando onChange cambie
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Crear una función estable que siempre use la última versión de onChange
  const stableOnChange = useCallback((updatedOrder: OrderContextOrder) => {
    if (onChangeRef.current) {
      onChangeRef.current(updatedOrder);
    }
  }, []);

  // Se obtienen los datos del pedido utilizando el hook
  const orderData = useOrder(orderId, stableOnChange, { canViewCostData });

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => orderData, [orderData]);

  return <OrderContext.Provider value={contextValue}>{children}</OrderContext.Provider>;
}

// Hook para consumir el contexto fácilmente
export function useOrderContext(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}
