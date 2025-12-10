// src/hooks/useSupplierOptions.js
import { useEffect, useState } from 'react';
import { getSupplierOptions } from '@/services/rawMaterialReceptionService';
import { useSession } from 'next-auth/react';

export const useSupplierOptions = () => {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [supplierOptions, setSupplierOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getSupplierOptions(token)
            .then((suppliers) => {
                setSupplierOptions(suppliers);
            })
            .catch(err => console.error('Error al cargar proveedores:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return { supplierOptions, loading };
};

