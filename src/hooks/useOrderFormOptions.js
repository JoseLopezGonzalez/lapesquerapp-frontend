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
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        const token = session?.user?.accessToken;

        console.log('useOrderFormOptions: useEffect ejecutado', {
            hasLoadedRef: hasLoadedRef.current,
            hasToken: !!token,
            currentLoading: loading,
            optionsCount: {
                salespeople: options.salespeople.length,
                incoterms: options.incoterms.length,
                paymentTerms: options.paymentTerms.length,
                transports: options.transports.length
            }
        });

        // Si ya se cargaron las opciones, asegurarse de que loading sea false y no volver a cargar
        if (hasLoadedRef.current && token) {
            // Asegurarse de que el estado de loading sea correcto
            console.log('useOrderFormOptions: Opciones ya cargadas, estableciendo loading a false');
            setLoading(false);
            return;
        }

        if (!token) {
            console.log('useOrderFormOptions: No hay token, estableciendo loading a false');
            setLoading(false);
            hasLoadedRef.current = false; // Resetear para permitir recarga cuando haya token
            return;
        }

        // Marcar que se está cargando
        console.log('useOrderFormOptions: Iniciando carga de opciones');
        hasLoadedRef.current = false;
        setLoading(true);

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
                if (!isMountedRef.current) {
                    console.log('useOrderFormOptions: Componente desmontado, no actualizando estado');
                    return;
                }

                console.log('useOrderFormOptions: Opciones cargadas exitosamente', {
                    salespeople: (salespeople || []).length,
                    incoterms: (incoterms || []).length,
                    paymentTerms: (paymentTerms || []).length,
                    transports: (transports || []).length
                });

                setOptions({
                    salespeople: salespeople || [],
                    incoterms: incoterms || [],
                    paymentTerms: paymentTerms || [],
                    transports: transports || [],
                });
                setLoading(false);
                setError(null);
                hasLoadedRef.current = true;
                console.log('useOrderFormOptions: Estado actualizado, loading=false, hasLoadedRef=true');
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

    // Efecto separado para corregir el estado de loading si las opciones ya están cargadas
    // Esto evita que el loading se quede en true cuando las opciones ya están disponibles
    useEffect(() => {
        // Si tenemos opciones cargadas y loading está en true, corregirlo inmediatamente
        const hasAnyOptions = options.salespeople.length > 0 || 
                              options.incoterms.length > 0 || 
                              options.paymentTerms.length > 0 || 
                              options.transports.length > 0;
        
        console.log('useOrderFormOptions: Segundo useEffect ejecutado', {
            hasAnyOptions,
            loading,
            optionsCount: {
                salespeople: options.salespeople.length,
                incoterms: options.incoterms.length,
                paymentTerms: options.paymentTerms.length,
                transports: options.transports.length
            },
            hasLoadedRef: hasLoadedRef.current
        });
        
        // Si tenemos opciones pero loading está en true, corregirlo
        if (hasAnyOptions && loading) {
            console.log('useOrderFormOptions: ⚠️ CORRIGIENDO loading a false porque hay opciones disponibles', {
                salespeople: options.salespeople.length,
                incoterms: options.incoterms.length,
                paymentTerms: options.paymentTerms.length,
                transports: options.transports.length,
                hasLoadedRef: hasLoadedRef.current
            });
            setLoading(false);
            // Si no se había marcado como cargado, marcarlo ahora
            if (!hasLoadedRef.current) {
                hasLoadedRef.current = true;
            }
        }
    }, [loading, options.salespeople.length, options.incoterms.length, options.paymentTerms.length, options.transports.length]);

    // Calcular loading final: si tenemos opciones, no deberíamos estar en loading
    const hasAnyOptions = options.salespeople.length > 0 || 
                          options.incoterms.length > 0 || 
                          options.paymentTerms.length > 0 || 
                          options.transports.length > 0;
    const finalLoading = loading && !hasAnyOptions;

    // Log del valor que se retorna
    if (loading !== finalLoading) {
        console.log('useOrderFormOptions: ⚠️ Ajustando loading en return', {
            loadingInterno: loading,
            finalLoading,
            hasAnyOptions
        });
    }

    return { options, loading: finalLoading, error };
}
