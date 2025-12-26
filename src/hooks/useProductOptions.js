// src/hooks/useProductsAndTaxesOptions.js
import { useEffect, useState } from 'react';
import { getProductOptions } from '@/services/productService';
/* import { getTaxTypesOptions } from '@/services/taxService'; */
import { useSession } from 'next-auth/react';
import { useOptions } from '@/context/OptionsContext';

/**
 * Hook to get product options
 * Uses OptionsContext if available (cached), otherwise falls back to direct API call
 * This allows gradual migration and backward compatibility
 */
export const useProductOptions = () => {
    // Try to use context first (cached data)
    const contextOptions = useOptions();
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    // Check if context is available and has data
    const hasContextData = contextOptions && contextOptions.productOptions && contextOptions.productOptions.length > 0;
    const contextLoading = contextOptions?.productsLoading ?? true;

    // Fallback state for when context is not available
    const [productOptions, setProductOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Only fetch if context is not available or doesn't have data
    useEffect(() => {
        // If context has data, use it
        if (hasContextData) {
            setProductOptions(contextOptions.productOptions);
            setLoading(false);
            return;
        }

        // If context is loading, wait for it
        if (contextLoading && contextOptions?.productOptions) {
            setLoading(true);
            return;
        }

        // Fallback: fetch directly if no context or context failed
        if (!token) {
            setLoading(false);
            return;
        }

        getProductOptions(token)
            .then((products) => {
                setProductOptions(products.map(p => ({ value: `${p.id}`, label: p.name })));
            })
            .catch(err => console.error('Error al cargar productos:', err))
            .finally(() => setLoading(false));
    }, [token, hasContextData, contextLoading, contextOptions]);

    // Return context data if available, otherwise return fallback
    if (hasContextData) {
        return { 
            productOptions: contextOptions.productOptions, 
            loading: contextOptions.productsLoading 
        };
    }

    return { productOptions, loading };
};
