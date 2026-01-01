/**
 * Common helpers for export functionality
 * 
 * Shared utility functions used across export helpers
 */

import { parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers';

/**
 * Parses a decimal value for export purposes
 * Returns 0 if parsing fails (doesn't throw errors, unlike BaseParser)
 * 
 * @param {*} value - Value to parse (string or number)
 * @returns {number} Parsed number, or 0 if parsing fails
 */
export function parseDecimalValue(value) {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return 0;
        
        if (trimmed.includes(',')) {
            const parsed = parseEuropeanNumber(trimmed);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        
        const dotMatches = trimmed.match(/\./g);
        if (dotMatches && dotMatches.length > 1) {
            const parts = trimmed.split('.');
            const decimalPart = parts.pop();
            const integerPart = parts.join('');
            const reconstructed = `${integerPart}.${decimalPart}`;
            const parsed = Number(reconstructed);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
}

/**
 * Calculates importe from weight and price
 * 
 * @param {number|string} weight - Weight value
 * @param {number|string} price - Price value
 * @returns {number} Calculated importe rounded to 2 decimals
 */
export function calculateImporte(weight, price) {
    const kilos = parseDecimalValue(weight);
    const precio = parseDecimalValue(price);
    const importe = kilos * precio;
    return Number.isFinite(importe) ? Number(importe.toFixed(2)) : 0;
}

