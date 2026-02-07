// src/hooks/useProductOptions.js
import { useEffect, useState } from 'react';
import { getProductOptions } from '@/services/productService';
import { useSession } from 'next-auth/react';
import { useOrdersManagerOptions } from '@/context/gestor-options/OrdersManagerOptionsContext';
import { useRawMaterialReceptionsOptions } from '@/context/gestor-options/RawMaterialReceptionsOptionsContext';

/**
 * Hook para obtener opciones de productos.
 * Usa el contexto del gestor actual si existe (Gestor de pedidos o Recepciones de materia prima),
 * si no hace fetch directo. Otros apartados (ej. Gestor de almacenes) pueden usar el hook
 * sin provider y obtienen los datos por API.
 * Ver: docs/OPCIONES-POR-GESTOR.md
 */
export const useProductOptions = () => {
  const ordersManagerOptions = useOrdersManagerOptions();
  const receptionsOptions = useRawMaterialReceptionsOptions();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [productOptions, setProductOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fromOrdersManager = ordersManagerOptions?.productOptions?.length > 0 || ordersManagerOptions?.productsLoading;
  const fromReceptions = receptionsOptions?.productOptions?.length > 0 || receptionsOptions?.productsLoading;

  useEffect(() => {
    if (fromOrdersManager && ordersManagerOptions?.productOptions?.length > 0) {
      setProductOptions(ordersManagerOptions.productOptions);
      setLoading(ordersManagerOptions.productsLoading ?? false);
      return;
    }
    if (fromReceptions && receptionsOptions?.productOptions?.length > 0) {
      setProductOptions(receptionsOptions.productOptions);
      setLoading(receptionsOptions.productsLoading ?? false);
      return;
    }
    if (fromOrdersManager && ordersManagerOptions?.productsLoading) {
      setLoading(true);
      return;
    }
    if (fromReceptions && receptionsOptions?.productsLoading) {
      setLoading(true);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    getProductOptions(token)
      .then((products) => {
        setProductOptions((products || []).map(p => ({ value: `${p.id}`, label: p.name })));
      })
      .catch(err => console.error('Error al cargar productos:', err))
      .finally(() => setLoading(false));
  }, [token, fromOrdersManager, fromReceptions, ordersManagerOptions, receptionsOptions]);

  if (fromOrdersManager && ordersManagerOptions?.productOptions?.length > 0) {
    return { productOptions: ordersManagerOptions.productOptions, loading: ordersManagerOptions.productsLoading ?? false };
  }
  if (fromReceptions && receptionsOptions?.productOptions?.length > 0) {
    return { productOptions: receptionsOptions.productOptions, loading: receptionsOptions.productsLoading ?? false };
  }

  return { productOptions, loading };
};
