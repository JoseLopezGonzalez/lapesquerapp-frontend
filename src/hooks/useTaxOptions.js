// src/hooks/useTaxOptions.js
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getTaxOptions } from '@/services/taxService';
import { useOrdersManagerOptions } from '@/context/gestor-options/OrdersManagerOptionsContext';

/**
 * Hook para obtener opciones de impuestos.
 * Usa el contexto del Gestor de pedidos si existe; si no, hace fetch directo.
 * Ver: docs/OPCIONES-POR-GESTOR.md
 */
export const useTaxOptions = () => {
  const ordersManagerOptions = useOrdersManagerOptions();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [taxOptions, setTaxOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fromOrdersManager = ordersManagerOptions?.taxOptions?.length > 0 || ordersManagerOptions?.taxOptionsLoading;

  useEffect(() => {
    if (fromOrdersManager && ordersManagerOptions.taxOptions?.length > 0) {
      setTaxOptions(ordersManagerOptions.taxOptions);
      setLoading(ordersManagerOptions.taxOptionsLoading ?? false);
      return;
    }
    if (fromOrdersManager && ordersManagerOptions.taxOptionsLoading) {
      setLoading(true);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    getTaxOptions(token)
      .then((taxes) => {
        setTaxOptions((taxes || []).map(t => ({ value: t.id, label: `${t.rate} %` })));
      })
      .catch(err => console.error('Error al cargar impuestos:', err))
      .finally(() => setLoading(false));
  }, [token, fromOrdersManager, ordersManagerOptions]);

  if (fromOrdersManager && ordersManagerOptions.taxOptions?.length > 0) {
    return { taxOptions: ordersManagerOptions.taxOptions, loading: ordersManagerOptions.taxOptionsLoading ?? false };
  }

  return { taxOptions, loading };
};
