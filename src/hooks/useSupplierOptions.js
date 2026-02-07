// src/hooks/useSupplierOptions.js
import { useEffect, useState } from 'react';
import { getSupplierOptions } from '@/services/rawMaterialReceptionService';
import { useSession } from 'next-auth/react';
import { useRawMaterialReceptionsOptions } from '@/context/gestor-options/RawMaterialReceptionsOptionsContext';

/**
 * Hook para obtener opciones de proveedores.
 * Usa el contexto de Recepciones de materia prima si existe; si no, hace fetch directo.
 * Ver: docs/OPCIONES-POR-GESTOR.md
 */
export const useSupplierOptions = () => {
  const receptionsOptions = useRawMaterialReceptionsOptions();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fromReceptions = receptionsOptions?.supplierOptions?.length > 0 || receptionsOptions?.suppliersLoading;

  useEffect(() => {
    if (fromReceptions && receptionsOptions.supplierOptions?.length > 0) {
      setSupplierOptions(receptionsOptions.supplierOptions);
      setLoading(receptionsOptions.suppliersLoading ?? false);
      return;
    }
    if (fromReceptions && receptionsOptions.suppliersLoading) {
      setLoading(true);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    getSupplierOptions(token)
      .then((suppliers) => setSupplierOptions(suppliers || []))
      .catch(err => console.error('Error al cargar proveedores:', err))
      .finally(() => setLoading(false));
  }, [token, fromReceptions, receptionsOptions]);

  if (fromReceptions && receptionsOptions.supplierOptions?.length > 0) {
    return { supplierOptions: receptionsOptions.supplierOptions, loading: receptionsOptions.suppliersLoading ?? false };
  }

  return { supplierOptions, loading };
};
