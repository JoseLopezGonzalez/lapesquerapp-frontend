"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getProductOptions } from "@/services/productService";
import { getSupplierOptions } from "@/services/rawMaterialReceptionService";
import { useSession } from "next-auth/react";

/**
 * Contexto de opciones solo para Recepciones de materia prima.
 * Carga productOptions y supplierOptions cuando el usuario está en esta sección.
 * Ver documentación: docs/OPCIONES-POR-GESTOR.md
 */
const RawMaterialReceptionsOptionsContext = createContext(null);

export function RawMaterialReceptionsOptionsProvider({ children }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [productOptions, setProductOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setProductsLoading(false);
      setSuppliersLoading(false);
      return;
    }

    setProductsLoading(true);
    setSuppliersLoading(true);

    Promise.all([
      getProductOptions(token).then((products) =>
        (products || []).map((p) => ({ value: `${p.id}`, label: p.name }))
      ),
      getSupplierOptions(token).then((suppliers) => suppliers || []),
    ])
      .then(([products, suppliers]) => {
        setProductOptions(products);
        setSupplierOptions(suppliers);
      })
      .catch((err) => {
        console.error("Error al cargar opciones de recepciones:", err);
      })
      .finally(() => {
        setProductsLoading(false);
        setSuppliersLoading(false);
      });
  }, [token]);

  const value = useMemo(
    () => ({
      productOptions,
      supplierOptions,
      productsLoading,
      suppliersLoading,
      loading: productsLoading || suppliersLoading,
    }),
    [productOptions, supplierOptions, productsLoading, suppliersLoading]
  );

  return (
    <RawMaterialReceptionsOptionsContext.Provider value={value}>
      {children}
    </RawMaterialReceptionsOptionsContext.Provider>
  );
}

export function useRawMaterialReceptionsOptions() {
  return useContext(RawMaterialReceptionsOptionsContext);
}

export { RawMaterialReceptionsOptionsContext };
