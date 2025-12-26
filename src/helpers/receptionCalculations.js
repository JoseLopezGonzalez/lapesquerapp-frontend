/**
 * Utility functions for reception calculations
 * Pure functions for calculating reception-related values
 */

/**
 * Calculates net weight from gross weight, number of boxes, and tare per box
 * @param {number|string} grossWeight - Gross weight in kg
 * @param {number|string} boxes - Number of boxes
 * @param {number|string} tare - Tare weight per box in kg
 * @returns {number} Net weight in kg (always >= 0)
 */
export const calculateNetWeight = (grossWeight, boxes, tare) => {
    const gross = parseFloat(grossWeight) || 0;
    const boxCount = parseInt(boxes) || 1;
    const tareWeight = parseFloat(tare) || 0;
    return Math.max(0, gross - (tareWeight * boxCount));
};

/**
 * Calculates net weight for multiple details
 * @param {Array} details - Array of detail objects with grossWeight, boxes, tare
 * @returns {Array} Array of net weights
 */
export const calculateNetWeights = (details) => {
    if (!Array.isArray(details)) return [];
    return details.map(detail => 
        calculateNetWeight(
            detail.grossWeight,
            detail.boxes,
            detail.tare
        )
    );
};

/**
 * Normalizes a date to avoid timezone issues
 * Sets time to 12:00:00 to avoid timezone shifts
 * @param {Date|string|null} date - Date to normalize
 * @returns {Date} Normalized date
 */
export const normalizeDate = (date) => {
    if (!date) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    }
    const normalized = date instanceof Date ? new Date(date) : new Date(date);
    if (isNaN(normalized.getTime())) {
        // Invalid date, return today
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    }
    normalized.setHours(12, 0, 0, 0);
    return normalized;
};

/**
 * Validates if a date is valid
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (date) => {
    if (!date) return false;
    const d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime());
};

