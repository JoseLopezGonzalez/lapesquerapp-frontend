// /src/context/OrderContext.js
'use client'
import React, { createContext, useContext } from 'react';
import { useStore } from '@/hooks/useStore';

// Creamos el contexto
const StoreContext = createContext();

// Componente proveedor del contexto
export function StoreProvider({ storeId, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, children }) {
  // Se obtienen los datos del pedido utilizando el hook
  const orderData = useStore({ storeId, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore });

  return (
    <StoreContext.Provider value={orderData}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook para consumir el contexto fácilmente
export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within an StoreProvider');
  }
  return context;
}
