"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getProductOptions } from "@/services/productService";
import { getTaxOptions } from "@/services/taxService";
import { useSession } from "next-auth/react";

/**
 * Contexto de opciones solo para el Gestor de pedidos.
 * Carga productOptions y taxOptions cuando el usuario está en esta sección.
 * Ver documentación: docs/OPCIONES-POR-GESTOR.md
 */
const OrdersManagerOptionsContext = createContext(null);

export function OrdersManagerOptionsProvider({ children }) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [productOptions, setProductOptions] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [taxOptionsLoading, setTaxOptionsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setProductsLoading(false);
      setTaxOptionsLoading(false);
      return;
    }

    setProductsLoading(true);
    setTaxOptionsLoading(true);

    Promise.all([
      getProductOptions(token).then((products) =>
        (products || []).map((p) => ({ value: `${p.id}`, label: p.name }))
      ),
      getTaxOptions(token).then((taxes) =>
        (taxes || []).map((t) => ({ value: t.id, label: `${t.rate} %` }))
      ),
    ])
      .then(([products, taxes]) => {
        setProductOptions(products);
        setTaxOptions(taxes);
      })
      .catch((err) => {
        console.error("Error al cargar opciones del gestor de pedidos:", err);
      })
      .finally(() => {
        setProductsLoading(false);
        setTaxOptionsLoading(false);
      });
  }, [token]);

  const value = useMemo(
    () => ({
      productOptions,
      taxOptions,
      productsLoading,
      taxOptionsLoading,
      loading: productsLoading || taxOptionsLoading,
    }),
    [productOptions, taxOptions, productsLoading, taxOptionsLoading]
  );

  return (
    <OrdersManagerOptionsContext.Provider value={value}>
      {children}
    </OrdersManagerOptionsContext.Provider>
  );
}

export function useOrdersManagerOptions() {
  return useContext(OrdersManagerOptionsContext);
}

export { OrdersManagerOptionsContext };
