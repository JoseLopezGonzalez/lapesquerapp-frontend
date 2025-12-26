// src/hooks/useSupplierOptions.js
import { useEffect, useState } from 'react';
import { getSupplierOptions } from '@/services/rawMaterialReceptionService';
import { useSession } from 'next-auth/react';
import { useOptions } from '@/context/OptionsContext';

/**
 * Hook to get supplier options
 * Uses OptionsContext if available (cached), otherwise falls back to direct API call
 * This allows gradual migration and backward compatibility
 */
export const useSupplierOptions = () => {
    // Try to use context first (cached data)
    const contextOptions = useOptions();
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    // Check if context is available and has data
    const hasContextData = contextOptions && contextOptions.supplierOptions && contextOptions.supplierOptions.length > 0;
    const contextLoading = contextOptions?.suppliersLoading ?? true;

    // Fallback state for when context is not available
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Only fetch if context is not available or doesn't have data
    useEffect(() => {
        // If context has data, use it
        if (hasContextData) {
            setSupplierOptions(contextOptions.supplierOptions);
            setLoading(false);
            return;
        }

        // If context is loading, wait for it
        if (contextLoading && contextOptions?.supplierOptions) {
            setLoading(true);
            return;
        }

        // Fallback: fetch directly if no context or context failed
        if (!token) {
            setLoading(false);
            return;
        }

        getSupplierOptions(token)
            .then((suppliers) => {
                setSupplierOptions(suppliers);
            })
            .catch(err => console.error('Error al cargar proveedores:', err))
            .finally(() => setLoading(false));
    }, [token, hasContextData, contextLoading, contextOptions]);

    // Return context data if available, otherwise return fallback
    if (hasContextData) {
        return { 
            supplierOptions: contextOptions.supplierOptions, 
            loading: contextOptions.suppliersLoading 
        };
    }

    return { supplierOptions, loading };
};

