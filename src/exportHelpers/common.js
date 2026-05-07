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

/**
 * Normalizes a date string to DD/MM/YYYY for A3ERP export.
 * Handles yyyy-MM-dd (ChatGPT) and DD/MM/YYYY (Azure raw text).
 *
 * @param {string} fecha - Date in any supported format
 * @returns {string} Date formatted as DD/MM/YYYY
 */
export function formatDateForA3(fecha) {
    if (!fecha) return '';
    const s = String(fecha).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;                 // DD/MM/YYYY — already correct
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {                           // yyyy-MM-dd (ChatGPT)
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {                         // yyyy/MM/dd
        const [y, m, d] = s.split('/');
        return `${d}/${m}/${y}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s.replace(/-/g, '/'); // DD-MM-YYYY
    return s;
}

/**
 * Calculates importe from a line item (venta, subasta, etc.)
 * Supports both kilos and pesoNeto as weight field.
 *
 * @param {Object} linea - Line item with weight and price
 * @param {string} [weightKey='kilos'] - Key for weight (e.g. 'kilos', 'pesoNeto')
 * @returns {number} Calculated importe rounded to 2 decimals
 */
export function calculateImporteFromLinea(linea, weightKey = 'kilos') {
    const declaredImporteRaw = linea?.importe;
    const hasDeclaredImporte =
        declaredImporteRaw !== undefined &&
        declaredImporteRaw !== null &&
        String(declaredImporteRaw).trim() !== '';

    const computedImporte = calculateImporte(
        linea?.[weightKey] ?? linea?.pesoNeto ?? linea?.kilos,
        linea?.precio
    );

    if (!hasDeclaredImporte) {
        return computedImporte;
    }

    const declaredImporte = parseDecimalValue(declaredImporteRaw);

    // Dual source of truth:
    // 1) Prefer extracted importe when it exists and is usable.
    // 2) Fallback to computed kilos*precio when extracted importe is 0 but
    //    computation yields a positive amount (common OCR partial extraction case).
    if (declaredImporte === 0 && computedImporte > 0) {
        return computedImporte;
    }

    return declaredImporte;
}

