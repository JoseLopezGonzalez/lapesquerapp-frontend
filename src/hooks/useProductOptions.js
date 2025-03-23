// src/hooks/useProductsAndTaxesOptions.js
import { useEffect, useState } from 'react';
import { getProductOptions } from '@/services/productService';
/* import { getTaxTypesOptions } from '@/services/taxService'; */
import { useSession } from 'next-auth/react';

export const useProductOptions = () => {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [productOptions, setProductOptions] = useState([]);
   /*  const [taxOptions, setTaxOptions] = useState([]); */
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getProductOptions(token)
            .then((products) => {
                setProductOptions(products.map(p => ({ value: `${p.id}`, label: p.name })));
            })
            .catch(err => console.error('Error al cargar productos:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return { productOptions, loading };
};
