"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getProductOptions } from "@/services/productService";
import { getSupplierOptions } from "@/services/rawMaterialReceptionService";
import { useSession } from "next-auth/react";

const OptionsContext = createContext();

/**
 * Provider for caching product and supplier options
 * Prevents duplicate API calls when multiple components need the same data
 */
export function OptionsProvider({ children }) {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [productOptions, setProductOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [suppliersLoading, setSuppliersLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load product options
    useEffect(() => {
        if (!token) {
            setProductsLoading(false);
            return;
        }

        getProductOptions(token)
            .then((products) => {
                setProductOptions(
                    products.map((p) => ({ value: `${p.id}`, label: p.name }))
                );
                setError(null);
            })
            .catch((err) => {
                console.error("Error al cargar productos:", err);
                setError(err);
            })
            .finally(() => setProductsLoading(false));
    }, [token]);

    // Load supplier options
    useEffect(() => {
        if (!token) {
            setSuppliersLoading(false);
            return;
        }

        getSupplierOptions(token)
            .then((suppliers) => {
                setSupplierOptions(suppliers);
                setError(null);
            })
            .catch((err) => {
                console.error("Error al cargar proveedores:", err);
                setError(err);
            })
            .finally(() => setSuppliersLoading(false));
    }, [token]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            productOptions,
            supplierOptions,
            productsLoading,
            suppliersLoading,
            loading: productsLoading || suppliersLoading,
            error,
            // Helper to refresh options if needed
            refreshProducts: () => {
                if (token) {
                    setProductsLoading(true);
                    getProductOptions(token)
                        .then((products) => {
                            setProductOptions(
                                products.map((p) => ({
                                    value: `${p.id}`,
                                    label: p.name,
                                }))
                            );
                        })
                        .catch((err) => {
                            console.error("Error al refrescar productos:", err);
                            setError(err);
                        })
                        .finally(() => setProductsLoading(false));
                }
            },
            refreshSuppliers: () => {
                if (token) {
                    setSuppliersLoading(true);
                    getSupplierOptions(token)
                        .then((suppliers) => {
                            setSupplierOptions(suppliers);
                        })
                        .catch((err) => {
                            console.error("Error al refrescar proveedores:", err);
                            setError(err);
                        })
                        .finally(() => setSuppliersLoading(false));
                }
            },
        }),
        [
            productOptions,
            supplierOptions,
            productsLoading,
            suppliersLoading,
            error,
            token,
        ]
    );

    return (
        <OptionsContext.Provider value={contextValue}>
            {children}
        </OptionsContext.Provider>
    );
}

/**
 * Hook to consume options context
 * @returns {Object} Options context value
 */
export function useOptions() {
    const context = useContext(OptionsContext);
    if (!context) {
        // Fallback: return empty arrays if context is not available
        // This allows components to work even if not wrapped in provider
        return {
            productOptions: [],
            supplierOptions: [],
            productsLoading: true,
            suppliersLoading: true,
            loading: true,
            error: null,
            refreshProducts: () => {},
            refreshSuppliers: () => {},
        };
    }
    return context;
}

