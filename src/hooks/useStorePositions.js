'use client';

import { UNLOCATED_POSITION_ID } from '@/configs/config';
import { getAvailableBoxes } from '@/helpers/pallet/boxAvailability';
import { useEffect, useMemo, useState } from 'react';import { notify } from '@/lib/notifications';
import { removePalletPosition } from '@/services/palletService';

const initialFilters = {
  types: { pallet: true, box: true, tub: true },
  products: [],
  pallets: [],
};

/**
 * Hook para lógica de posiciones, filtros y derivados del almacén.
 * @param {Object} params
 * @param {Object} params.store - Datos del almacén
 * @param {Function} params.setStore - Setter del store (para mutaciones)
 * @param {string} [params.token] - Token de autenticación
 */
export function useStorePositions({ store, setStore, token }) {
  const [filters, setFilters] = useState(initialFilters);
  const [speciesSummary, setSpeciesSummary] = useState([]);
  const [filteredPositionsMap, setFilteredPositionsMap] = useState(new Map());

  const onChangeFilters = (newFilters) => setFilters(newFilters);
  const resetFilters = () => setFilters(initialFilters);

  const productsOptions = useMemo(() => {
    const productsMap = new Map();
    store?.content?.pallets?.forEach((pallet) => {
      pallet.boxes?.forEach((box) => {
        const product = box?.product;
        if (product?.id) productsMap.set(product.id, product);
      });
    });
    return Array.from(productsMap.values()).map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [store?.content?.pallets]);

  const palletsOptions = useMemo(
    () =>
      store?.content?.pallets?.map((p) => ({ value: p.id, label: p.id })) ?? [],
    [store?.content?.pallets]
  );

  const unlocatedPallets = useMemo(
    () =>
      store?.content?.pallets
        ?.filter((p) => !p.position)
        ?.sort((a, b) => a.id - b.id) ?? [],
    [store?.content?.pallets]
  );

  useEffect(() => {
    const map = new Map();
    let totalWeight = 0;
    let totalProductWeight = 0;

    store?.content?.pallets?.forEach((pallet) => {
      const availableBoxes = getAvailableBoxes(pallet.boxes || []);
      availableBoxes.forEach((box) => {
        const speciesName = box.product?.species?.name;
        const productName = box.product?.name;
        const netWeight = Number(box.netWeight) || 0;

        if (speciesName && productName) {
          totalWeight += netWeight;
          totalProductWeight += netWeight;

          if (!map.has(speciesName)) {
            map.set(speciesName, {
              name: speciesName,
              quantity: 0,
              products: new Map(),
            });
          }

          const speciesData = map.get(speciesName);
          speciesData.quantity += netWeight;

          if (!speciesData.products.has(productName)) {
            speciesData.products.set(productName, {
              quantity: 0,
              boxes: 0,
            });
          }

          const productData = speciesData.products.get(productName);
          productData.quantity += netWeight;
          productData.boxes += 1;
        }
      });
    });

    const result = Array.from(map.values()).map((entry) => {
      const speciesPercentage = totalWeight > 0 ? (entry.quantity / totalWeight) * 100 : 0;
      const products = Array.from(entry.products.entries()).map(([name, data]) => ({
        name,
        quantity: data.quantity,
        boxes: data.boxes,
        productPercentage:
          totalProductWeight > 0 ? (data.quantity / totalProductWeight) * 100 : 0,
      }));

      return {
        name: entry.name,
        quantity: entry.quantity,
        percentage: speciesPercentage,
        products: products.sort((a, b) => a.name.localeCompare(b.name)),
      };
    });

    setSpeciesSummary(result);
  }, [store]);

  useEffect(() => {
    const map = new Map();
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;

    store?.content?.pallets?.forEach((pallet) => {
      let matchesFilters = true;
      if (hasActiveFilters) {
        const matchProduct = hasProductFilters
          ? pallet.boxes?.some((box) => filters.products.includes(box.product?.id))
          : true;
        const matchPallet = hasPalletFilters
          ? filters.pallets.includes(pallet.id)
          : true;
        matchesFilters = matchProduct && matchPallet;
      }

      if (!matchesFilters) return;

      if (!pallet.position) {
        if (!map.has(UNLOCATED_POSITION_ID)) map.set(UNLOCATED_POSITION_ID, []);
        map.get(UNLOCATED_POSITION_ID).push(pallet);
        return;
      }

      if (!map.has(pallet.position)) map.set(pallet.position, []);
      map.get(pallet.position).push(pallet);
    });

    setFilteredPositionsMap(map);
  }, [store, filters]);

  const isPositionRelevant = (positionId) => {
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;
    if (!hasActiveFilters) return false;
    return (
      filteredPositionsMap.has(positionId) &&
      filteredPositionsMap.get(positionId).length > 0
    );
  };

  const isPositionFilled = (positionId) => {
    if (positionId === UNLOCATED_POSITION_ID) return unlocatedPallets.length > 0;
    return store?.content?.pallets?.some((p) => p.position === positionId) ?? false;
  };

  const isPalletRelevant = (palletId) => {
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;
    if (!hasActiveFilters) return false;
    for (const pallets of filteredPositionsMap.values()) {
      if (pallets.some((p) => p.id === palletId)) return true;
    }
    return false;
  };

  const getPositionPallets = (positionId) =>
    store?.content?.pallets
      ?.filter((p) => p.position === positionId)
      ?.sort((a, b) => a.id - b.id) ?? [];

  const getPosition = (positionId) =>
    store?.map?.posiciones?.find((p) => p.id === positionId) ?? null;

  const changePalletsPosition = (palletsIds, positionId) => {
    setStore((prevStore) => {
      if (!prevStore?.content?.pallets) return prevStore;
      const updatedPallets = prevStore.content.pallets.map((pallet) =>
        palletsIds.includes(pallet.id) ? { ...pallet, position: positionId } : pallet
      );
      return {
        ...prevStore,
        content: { ...prevStore.content, pallets: updatedPallets },
      };
    });
  };

  const removePalletFromPosition = async (palletId) => {
    if (!token) return;
    try {
      await removePalletPosition(palletId, token);
      setStore((prevStore) => {
        if (!prevStore?.content?.pallets) return prevStore;
        const updatedPallets = prevStore.content.pallets.map((pallet) =>
          pallet.id === palletId ? { ...pallet, position: null } : pallet
        );
        return {
          ...prevStore,
          content: { ...prevStore.content, pallets: updatedPallets },
        };
      });
      notify.success('Posición eliminada correctamente');
    } catch (error) {
      notify.error('Error al quitar la posición');
    }
  };

  return {
    filters,
    onChangeFilters,
    resetFilters,
    filteredPositionsMap,
    productsOptions,
    palletsOptions,
    speciesSummary,
    unlocatedPallets,
    isPositionRelevant,
    isPositionFilled,
    isPalletRelevant,
    getPositionPallets,
    getPosition,
    changePalletsPosition,
    removePalletFromPosition,
  };
}
