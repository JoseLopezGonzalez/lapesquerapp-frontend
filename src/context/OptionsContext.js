"use client";

import React, { createContext, useContext } from "react";

/**
 * @deprecated Opciones globales de productos/proveedores.
 * Sustituido por contextos por gestor (solo cargan al entrar en cada sección).
 * Ver: docs/OPCIONES-POR-GESTOR.md y src/context/gestor-options/
 */
const OptionsContext = createContext(null);

/** @deprecated Passthrough: ya no carga datos. Usar OrdersManagerOptionsProvider o RawMaterialReceptionsOptionsProvider. */
export function OptionsProvider({ children }) {
  return children;
}

/**
 * @deprecated Los hooks useProductOptions/useSupplierOptions usan ahora contextos por gestor o API directa. Ver docs/OPCIONES-POR-GESTOR.md
 * @returns {Object} Options context value (vacío si no hay provider)
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

