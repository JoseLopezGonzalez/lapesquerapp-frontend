'use client';

import { UNLOCATED_POSITION_ID } from '@/configs/config';
import { getAvailableBoxes } from '@/helpers/pallet/boxAvailability';
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/lib/notifications';
import { removePalletPosition } from '@/services/palletService';
import type { StoreData, StorePallet } from '@/hooks/useStoreDialogs';
import type { Dispatch, SetStateAction } from 'react';

interface Filters {
  types: { pallet: boolean; box: boolean; tub: boolean };
  products: (string | number)[];
  pallets: (string | number)[];
}

const initialFilters: Filters = {
  types: { pallet: true, box: true, tub: true },
  products: [],
  pallets: [],
};

interface UseStorePositionsParams {
  store: StoreData | null;
  setStore: Dispatch<SetStateAction<StoreData | null>>;
  token: string | undefined;
}

export function useStorePositions({ store, setStore, token }: UseStorePositionsParams) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [speciesSummary, setSpeciesSummary] = useState<unknown[]>([]);
  const [filteredPositionsMap, setFilteredPositionsMap] = useState<Map<string | number, StorePallet[]>>(new Map());

  const onChangeFilters = (newFilters: Filters) => setFilters(newFilters);
  const resetFilters = () => setFilters(initialFilters);

  const productsOptions = useMemo(() => {
    const productsMap = new Map<string | number, { id: string | number; name: string }>();
    store?.content?.pallets?.forEach((pallet) => {
      pallet.boxes?.forEach((box) => {
        const product = (box as { product?: { id?: string | number; name?: string } }).product;
        if (product?.id) productsMap.set(product.id, product as { id: string | number; name: string });
      });
    });
    return Array.from(productsMap.values()).map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }, [store?.content?.pallets]);

  const palletsOptions = useMemo(
    () => store?.content?.pallets?.map((p) => ({ value: p.id, label: String(p.id) })) ?? [],
    [store?.content?.pallets]
  );

  const unlocatedPallets = useMemo(
    () =>
      store?.content?.pallets
        ?.filter((p) => !p.position)
        ?.sort((a, b) => Number(a.id) - Number(b.id)) ?? [],
    [store?.content?.pallets]
  );

  useEffect(() => {
    const map = new Map<string, { name: string; quantity: number; products: Map<string, { quantity: number; boxes: number }> }>();
    let totalWeight = 0;
    let totalProductWeight = 0;

    store?.content?.pallets?.forEach((pallet) => {
      const availableBoxes = getAvailableBoxes(pallet.boxes || []) as Array<{
        product?: { species?: { name?: string }; name?: string };
        netWeight?: string | number;
      }>;
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

          const speciesData = map.get(speciesName)!;
          speciesData.quantity += netWeight;

          if (!speciesData.products.has(productName)) {
            speciesData.products.set(productName, { quantity: 0, boxes: 0 });
          }

          const productData = speciesData.products.get(productName)!;
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
        productPercentage: totalProductWeight > 0 ? (data.quantity / totalProductWeight) * 100 : 0,
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
    const map = new Map<string | number, StorePallet[]>();
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;

    store?.content?.pallets?.forEach((pallet) => {
      let matchesFilters = true;
      if (hasActiveFilters) {
        const matchProduct = hasProductFilters
          ? pallet.boxes?.some((box) => {
              const product = (box as { product?: { id?: string | number } }).product;
              return filters.products.includes(product?.id as string | number);
            })
          : true;
        const matchPallet = hasPalletFilters ? filters.pallets.includes(pallet.id) : true;
        matchesFilters = (matchProduct ?? false) && matchPallet;
      }

      if (!matchesFilters) return;

      const position = pallet.position as string | undefined;
      if (!position) {
        if (!map.has(UNLOCATED_POSITION_ID)) map.set(UNLOCATED_POSITION_ID, []);
        map.get(UNLOCATED_POSITION_ID)!.push(pallet);
        return;
      }

      if (!map.has(position)) map.set(position, []);
      map.get(position)!.push(pallet);
    });

    setFilteredPositionsMap(map);
  }, [store, filters]);

  const isPositionRelevant = (positionId: string | number) => {
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;
    if (!hasActiveFilters) return false;
    return filteredPositionsMap.has(positionId) && (filteredPositionsMap.get(positionId)?.length ?? 0) > 0;
  };

  const isPositionFilled = (positionId: string | number) => {
    if (positionId === UNLOCATED_POSITION_ID) return unlocatedPallets.length > 0;
    return store?.content?.pallets?.some((p) => p.position === positionId) ?? false;
  };

  const isPalletRelevant = (palletId: string | number) => {
    const hasProductFilters = filters.products.length > 0;
    const hasPalletFilters = filters.pallets.length > 0;
    const hasActiveFilters = hasProductFilters || hasPalletFilters;
    if (!hasActiveFilters) return false;
    for (const pallets of filteredPositionsMap.values()) {
      if (pallets.some((p) => p.id === palletId)) return true;
    }
    return false;
  };

  const getPositionPallets = (positionId: string | number | null | undefined) =>
    store?.content?.pallets
      ?.filter((p) => p.position === positionId)
      ?.sort((a, b) => Number(a.id) - Number(b.id)) ?? [];

  const getPosition = (positionId: string | number | null | undefined) =>
    (store as { map?: { posiciones?: Array<{ id: string | number; nombre?: string; [key: string]: unknown }> } } | null)?.map?.posiciones?.find(
      (p) => p.id === positionId
    ) ?? null;

  const changePalletsPosition = (palletsIds: (string | number)[], positionId: string | number) => {
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

  const removePalletFromPosition = async (palletId: string | number) => {
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
      notify.success({ title: 'Posición eliminada correctamente' });
    } catch {
      notify.error({ title: 'Error al quitar la posición' });
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
