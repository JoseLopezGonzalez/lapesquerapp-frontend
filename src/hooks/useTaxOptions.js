// src/hooks/useProductsAndTaxesOptions.js
import { useEffect, useState } from 'react';
import { getProductOptions } from '@/services/productService';
/* import { getTaxTypesOptions } from '@/services/taxService'; */
import { useSession } from 'next-auth/react';
import { getTaxOptions } from '@/services/taxService';

export const useTaxOptions = () => {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [taxOptions, setTaxOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getTaxOptions(token)
            .then((taxes) => {
                setTaxOptions(taxes.map(t => ({ value: `${t.id}`, label: `${t.rate} %` })));
            })
            .catch(err => console.error('Error al cargar impuestos:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return { taxOptions, loading };
};
