// /src/hooks/useOrderFormOptions.js
// Hook compartido para cargar opciones del formulario de pedidos
import { getIncotermsOptions } from '@/services/incotermService';
import { getPaymentTermsOptions } from '@/services/paymentTernService';
import { getSalespeopleOptions } from '@/services/salespersonService';
import { getTransportsOptions } from '@/services/transportService';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';

/**
 * Hook para cargar opciones del formulario de pedidos
 * Carga todas las opciones en paralelo para mejor rendimiento
 * 
 * @returns {Object} { options, loading, error }
 *   - options: { salespeople, incoterms, paymentTerms, transports }
 *   - loading: boolean
 *   - error: Error | null
 */
export function useOrderFormOptions() {
    const { data: session } = useSession();
    const [options, setOptions] = useState({
        salespeople: [],
        incoterms: [],
        paymentTerms: [],
        transports: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const token = session?.user?.accessToken;

        if (!token) {
            setLoading(false);
            return;
        }

        // Cargar todas las opciones en paralelo
        Promise.all([
            getSalespeopleOptions(token).catch((err) => {
                console.error('Error loading salespeople:', err);
                return [];
            }),
            getIncotermsOptions(token).catch((err) => {
                console.error('Error loading incoterms:', err);
                return [];
            }),
            getPaymentTermsOptions(token).catch((err) => {
                console.error('Error loading payment terms:', err);
                return [];
            }),
            getTransportsOptions(token).catch((err) => {
                console.error('Error loading transports:', err);
                return [];
            }),
        ])
            .then(([salespeople, incoterms, paymentTerms, transports]) => {
                // Verificar que el componente sigue montado antes de actualizar estado
                if (!isMountedRef.current) return;

                setOptions({
                    salespeople: salespeople || [],
                    incoterms: incoterms || [],
                    paymentTerms: paymentTerms || [],
                    transports: transports || [],
                });
                setLoading(false);
                setError(null);
            })
            .catch((err) => {
                console.error('Error loading form options:', err);
                if (isMountedRef.current) {
                    setError(err);
                    setLoading(false);
                }
            });

        // Cleanup: marcar como desmontado cuando el componente se desmonte
        return () => {
            isMountedRef.current = false;
        };
    }, [session?.user?.accessToken]);

    return { options, loading, error };
}

