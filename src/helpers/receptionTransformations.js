/**
 * Utility functions for transforming reception data
 * Pure functions for converting between frontend and API formats
 */

/**
 * Creates a price key from product ID and lot
 * Ensures consistent key format for price synchronization
 * @param {number|string} productId - Product ID
 * @param {string|undefined|null} lot - Lot identifier
 * @returns {string} Price key in format "productId-lot"
 */
export const createPriceKey = (productId, lot) => {
    const normalizedLot = lot || '';
    return `${productId}-${normalizedLot}`;
};

/**
 * Builds a map of price keys to palet indices for O(1) lookup
 * @param {Array} temporalPallets - Array of temporal pallet items
 * @returns {Map<string, number[]>} Map of priceKey -> array of palet indices
 */
export const buildPriceKeyToPalletsMap = (temporalPallets) => {
    const map = new Map();
    
    if (!Array.isArray(temporalPallets)) return map;
    
    temporalPallets.forEach((item, palletIdx) => {
        const pallet = item?.pallet;
        if (!pallet?.boxes) return;
        
        pallet.boxes.forEach(box => {
            if (box.product?.id) {
                const key = createPriceKey(box.product.id, box.lot);
                if (!map.has(key)) {
                    map.set(key, []);
                }
                if (!map.get(key).includes(palletIdx)) {
                    map.get(key).push(palletIdx);
                }
            }
        });
    });
    
    return map;
};

/**
 * Extracts unique product+lot combinations from all pallets
 * @param {Array} temporalPallets - Array of temporal pallet items
 * @returns {Map<string, Object>} Map of priceKey -> price entry
 */
export const extractGlobalPriceMap = (temporalPallets) => {
    const globalPriceMap = new Map();
    
    if (!Array.isArray(temporalPallets)) return globalPriceMap;
    
    temporalPallets.forEach((item) => {
        const pallet = item?.pallet;
        const pricesObj = item?.prices || {};
        
        if (!pallet?.boxes) return;
        
        pallet.boxes.forEach(box => {
            if (box.product?.id) {
                const key = createPriceKey(box.product.id, box.lot);
                const priceValue = pricesObj[key];
                
                // Always update to get the latest value (last pallet processed wins)
                if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
                    globalPriceMap.set(key, {
                        product: { id: box.product.id },
                        lot: box.lot || undefined,
                        price: parseFloat(priceValue),
                    });
                } else if (!globalPriceMap.has(key)) {
                    // Only set undefined price if we haven't seen this combination before
                    globalPriceMap.set(key, {
                        product: { id: box.product.id },
                        lot: box.lot || undefined,
                        price: undefined,
                    });
                }
            }
        });
    });
    
    return globalPriceMap;
};

/**
 * Transforms temporal pallets to API format for mode 'pallets'
 * @param {Array} temporalPallets - Array of temporal pallet items
 * @param {Set<number>} originalBoxIds - Set of original box IDs from backend
 * @returns {Array} Array of pallets in API format
 */
export const transformPalletsToApiFormat = (temporalPallets, originalBoxIds = new Set()) => {
    if (!Array.isArray(temporalPallets)) return [];
    
    const validPallets = temporalPallets
        .filter(item => item?.pallet?.boxes?.length > 0)
        .map(item => {
            const pallet = item.pallet;
            const validBoxes = pallet.boxes.filter(box => box.product?.id && box.netWeight);
            
            if (validBoxes.length === 0) return null;
            
            return {
                item,
                pallet,
                validBoxes,
            };
        })
        .filter(p => p !== null);
    
    return validPallets.map(({ item, pallet, validBoxes }) => {
        const boxes = validBoxes.map(box => {
            const boxData = {
                product: {
                    id: box.product.id,
                },
                lot: box.lot || undefined,
                gs1128: box.gs1128 || undefined,
                grossWeight: box.grossWeight ? parseFloat(box.grossWeight) : undefined,
                netWeight: box.netWeight ? parseFloat(box.netWeight) : undefined,
            };
            
            // Only include ID if it's a real backend ID
            if (box.id && originalBoxIds.has(box.id)) {
                boxData.id = box.id;
            } else {
                boxData.id = null; // New box
            }
            
            return boxData;
        });
        
        return {
            ...(pallet.id && { id: pallet.id }),
            observations: item.observations || pallet.observations || undefined,
            boxes: boxes,
        };
    });
};

/**
 * Transforms details to API format for mode 'lines'
 * @param {Array} details - Array of detail objects from form
 * @returns {Array} Array of details in API format
 */
export const transformDetailsToApiFormat = (details) => {
    if (!Array.isArray(details)) return [];
    
    return details
        .filter(detail => detail.product && detail.netWeight && parseFloat(detail.netWeight) > 0)
        .map(detail => ({
            product: {
                id: parseInt(detail.product),
            },
            netWeight: parseFloat(detail.netWeight),
            price: detail.price ? parseFloat(detail.price) : undefined,
            lot: detail.lot || undefined,
            boxes: detail.boxes ? parseInt(detail.boxes) : undefined,
        }));
};

/**
 * Builds product+lot summary from pallet boxes
 * Used for displaying pallet information in tables
 * @param {Object} pallet - Pallet object with boxes
 * @returns {Array} Array of product+lot combinations with counts and weights
 */
export const buildProductLotSummary = (pallet) => {
    if (!pallet?.boxes || !Array.isArray(pallet.boxes)) return [];
    
    const productLotMap = new Map();
    
    pallet.boxes.forEach(box => {
        if (box.product?.id) {
            const lot = box.lot || '';
            const key = `${box.product.id}-${lot}`;
            
            if (!productLotMap.has(key)) {
                productLotMap.set(key, {
                    productId: box.product.id,
                    productName: box.product.name || box.product.alias || 'Producto sin nombre',
                    lot: lot,
                    boxesCount: 0,
                    totalNetWeight: 0,
                });
            }
            
            const entry = productLotMap.get(key);
            entry.boxesCount += 1;
            entry.totalNetWeight += parseFloat(box.netWeight || 0);
        }
    });
    
    return Array.from(productLotMap.values());
};

/**
 * Maps backend pallets to temporalPallets format, preserving metadata (prices, observations)
 * and updating IDs from backend response
 * @param {Array} backendPallets - Array of pallets from backend response
 * @param {Array} currentTemporalPallets - Current temporalPallets to preserve metadata
 * @param {Object} globalPricesObj - Global prices object from reception
 * @returns {Array} Updated temporalPallets with backend IDs
 */
export const mapBackendPalletsToTemporal = (backendPallets, currentTemporalPallets = [], globalPricesObj = {}) => {
    if (!Array.isArray(backendPallets)) return [];
    
    // Create a map of current temporal pallets by index for quick lookup
    // We'll try to match by order and box content
    const updatedTemporalPallets = [];
    
    backendPallets.forEach((backendPallet, index) => {
        // Convert backend boxes to frontend format
        const boxes = (backendPallet.boxes || []).map(box => ({
            id: box.id,
            product: box.product ? {
                id: box.product.id,
                name: box.product.name || box.product.alias || '',
            } : null,
            lot: box.lot || '',
            grossWeight: box.grossWeight ? parseFloat(box.grossWeight).toString() : '',
            netWeight: box.netWeight ? parseFloat(box.netWeight).toString() : '',
            gs1128: box.gs1128 || undefined,
            isAvailable: box.isAvailable !== false,
            production: box.production || null,
        }));
        
        // Try to preserve metadata from current temporal pallets
        // Match by index first, then by pallet structure
        let preservedMetadata = null;
        if (currentTemporalPallets[index]) {
            preservedMetadata = {
                prices: currentTemporalPallets[index].prices || {},
                observations: currentTemporalPallets[index].observations || backendPallet.observations || '',
            };
        } else {
            // Build prices object for this pallet from global prices
            const palletPricesObj = {};
            boxes.forEach(box => {
                if (box.product?.id && box.lot) {
                    const key = `${box.product.id}-${box.lot}`;
                    if (globalPricesObj[key]) {
                        palletPricesObj[key] = globalPricesObj[key];
                    }
                }
            });
            
            preservedMetadata = {
                prices: palletPricesObj,
                observations: backendPallet.observations || '',
            };
        }
        
        updatedTemporalPallets.push({
            pallet: {
                id: backendPallet.id, // Update with backend ID
                boxes: boxes,
                numberOfBoxes: boxes.length,
                netWeight: boxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                observations: backendPallet.observations || '',
            },
            prices: preservedMetadata.prices,
            observations: preservedMetadata.observations,
        });
    });
    
    return updatedTemporalPallets;
};

