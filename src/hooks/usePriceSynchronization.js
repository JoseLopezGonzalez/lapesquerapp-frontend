/**
 * Hook for managing price synchronization across pallets
 * Optimized O(n) algorithm instead of O(n²)
 */
import { useMemo, useCallback } from 'react';
import { buildPriceKeyToPalletsMap, createPriceKey } from '@/helpers/receptionTransformations';

/**
 * Hook for synchronizing prices across pallets
 * @param {Array} temporalPallets - Array of temporal pallet items
 * @param {Function} setTemporalPallets - State setter for temporal pallets
 * @returns {Object} Object with price synchronization functions and data
 */
export const usePriceSynchronization = (temporalPallets, setTemporalPallets) => {
    // Build map of priceKey -> palet indices for O(1) lookup
    const priceKeyToPalletsMap = useMemo(() => {
        return buildPriceKeyToPalletsMap(temporalPallets);
    }, [temporalPallets]);

    /**
     * Updates price for a specific product+lot combination across all affected pallets
     * Optimized O(n) instead of O(n²)
     * @param {string} priceKey - Price key in format "productId-lot"
     * @param {string|number} newPrice - New price value
     */
    const updatePrice = useCallback((priceKey, newPrice) => {
        setTemporalPallets(prev => {
            const updated = [...prev];
            
            // Get all palet indices affected by this price key (O(1) lookup)
            const affectedPalletIndices = priceKeyToPalletsMap.get(priceKey) || [];
            
            // Update only affected pallets (O(n) where n = number of affected pallets)
            affectedPalletIndices.forEach(palletIdx => {
                if (palletIdx >= 0 && palletIdx < updated.length) {
                    if (!updated[palletIdx].prices) {
                        updated[palletIdx].prices = {};
                    }
                    updated[palletIdx].prices = {
                        ...updated[palletIdx].prices,
                        [priceKey]: newPrice
                    };
                }
            });
            
            return updated;
        });
    }, [priceKeyToPalletsMap, setTemporalPallets]);

    /**
     * Updates price for a specific palet and synchronizes to others
     * @param {number} paletIndex - Index of the palet being edited
     * @param {number} productId - Product ID
     * @param {string} lot - Lot identifier
     * @param {string|number} newPrice - New price value
     */
    const updatePriceForPalet = useCallback((paletIndex, productId, lot, newPrice) => {
        const priceKey = createPriceKey(productId, lot);
        updatePrice(priceKey, newPrice);
    }, [updatePrice]);

    return {
        priceKeyToPalletsMap,
        updatePrice,
        updatePriceForPalet,
    };
};

