/**
 * Helper functions para manejar la disponibilidad de cajas en palets
 * 
 * Estas funciones priorizan los valores calculados del backend cuando están disponibles,
 * y calculan desde las cajas cuando no lo están (palets temporales, nuevos, etc.)
 */

/**
 * Verifica si una caja está disponible
 * @param {Object} box - Caja a verificar
 * @returns {boolean} - true si la caja está disponible
 */
export const isBoxAvailable = (box) => {
    return box.isAvailable !== false;
};

/**
 * Obtiene todas las cajas disponibles de un array de cajas
 * @param {Array} boxes - Array de cajas
 * @returns {Array} - Array de cajas disponibles
 */
export const getAvailableBoxes = (boxes) => {
    return (boxes || []).filter(isBoxAvailable);
};

/**
 * Obtiene todas las cajas usadas (en producción) de un array de cajas
 * @param {Array} boxes - Array de cajas
 * @returns {Array} - Array de cajas usadas
 */
export const getUsedBoxes = (boxes) => {
    return (boxes || []).filter(box => box.isAvailable === false);
};

/**
 * Obtiene el conteo de cajas disponibles.
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 * 
 * @param {Object} pallet - Palet con cajas
 * @returns {number} - Número de cajas disponibles
 */
export const getAvailableBoxesCount = (pallet) => {
    if (pallet?.availableBoxesCount !== undefined) {
        return pallet.availableBoxesCount;
    }
    return getAvailableBoxes(pallet?.boxes || []).length;
};

/**
 * Obtiene el peso total de cajas disponibles.
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 * 
 * @param {Object} pallet - Palet con cajas
 * @returns {number} - Peso total de cajas disponibles
 */
export const getAvailableNetWeight = (pallet) => {
    if (pallet?.totalAvailableWeight !== undefined) {
        return parseFloat(pallet.totalAvailableWeight);
    }
    return getAvailableBoxes(pallet?.boxes || []).reduce(
        (total, box) => total + parseFloat(box.netWeight || 0),
        0
    );
};

/**
 * Obtiene el conteo de cajas usadas (en producción).
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 * 
 * @param {Object} pallet - Palet con cajas
 * @returns {number} - Número de cajas usadas
 */
export const getUsedBoxesCount = (pallet) => {
    if (pallet?.usedBoxesCount !== undefined) {
        return pallet.usedBoxesCount;
    }
    return getUsedBoxes(pallet?.boxes || []).length;
};

/**
 * Obtiene el peso total de cajas usadas (en producción).
 * Prioriza el valor del backend si está disponible, sino calcula desde las cajas.
 * 
 * @param {Object} pallet - Palet con cajas
 * @returns {number} - Peso total de cajas usadas
 */
export const getUsedNetWeight = (pallet) => {
    if (pallet?.totalUsedWeight !== undefined) {
        return parseFloat(pallet.totalUsedWeight);
    }
    return getUsedBoxes(pallet?.boxes || []).reduce(
        (total, box) => total + parseFloat(box.netWeight || 0),
        0
    );
};

