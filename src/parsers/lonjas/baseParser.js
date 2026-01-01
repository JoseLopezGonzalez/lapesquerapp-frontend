/**
 * Base parser class with common parsing methods
 * 
 * This class provides reusable parsing methods that can be extended
 * by specific document type parsers.
 */

import { ParsingError } from '@/errors/lonjasErrors';
import { parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers';

export class BaseParser {
    /**
     * Parses a decimal value from various formats
     * Handles European format (comma as decimal separator) and multiple dots
     * @param {*} value - Value to parse (string or number)
     * @param {string} fieldName - Name of the field for error messages (optional)
     * @returns {number} Parsed number
     */
    parseDecimalValue(value, fieldName = null) {
        if (typeof value === 'number') {
            if (isNaN(value) || !Number.isFinite(value)) {
                throw new ParsingError(
                    `Valor numérico inválido: ${fieldName || 'campo'}`,
                    fieldName,
                    value
                );
            }
            return value;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            
            if (trimmed === '') {
                return 0; // Empty string returns 0 (not an error for parsing)
            }

            // Handle European format (comma as decimal separator)
            if (trimmed.includes(',')) {
                try {
                    const parsed = parseEuropeanNumber(trimmed);
                    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
                        throw new ParsingError(
                            `No se pudo parsear número con formato europeo: ${fieldName || 'campo'}`,
                            fieldName,
                            value
                        );
                    }
                    return parsed;
                } catch (error) {
                    if (error instanceof ParsingError) {
                        throw error;
                    }
                    throw new ParsingError(
                        `Error al parsear número: ${fieldName || 'campo'}`,
                        fieldName,
                        value
                    );
                }
            }

            // Handle multiple dots (e.g., "1.000.50" -> 1000.50)
            const dotMatches = trimmed.match(/\./g);
            if (dotMatches && dotMatches.length > 1) {
                const parts = trimmed.split('.');
                const decimalPart = parts.pop();
                const integerPart = parts.join('');
                const reconstructed = `${integerPart}.${decimalPart}`;
                const parsed = Number(reconstructed);
                if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
                    throw new ParsingError(
                        `No se pudo parsear número con múltiples puntos: ${fieldName || 'campo'}`,
                        fieldName,
                        value
                    );
                }
                return parsed;
            }

            // Standard number parsing
            const parsed = Number(trimmed);
            if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
                throw new ParsingError(
                    `No se pudo parsear número: ${fieldName || 'campo'}`,
                    fieldName,
                    value
                );
            }
            return parsed;
        }

        // For other types, try to convert to number
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
            throw new ParsingError(
                `Tipo de dato no válido para parsear como número: ${fieldName || 'campo'}`,
                fieldName,
                value
            );
        }
        return parsed;
    }

    /**
     * Parses a string value, trimming whitespace
     * @param {*} value - Value to parse
     * @param {string} fieldName - Name of the field for error messages (optional)
     * @returns {string} Parsed string
     */
    parseString(value, fieldName = null) {
        if (value === null || value === undefined) {
            return ''; // Return empty string for null/undefined (not an error)
        }
        return String(value).trim();
    }

    /**
     * Parses an integer value
     * @param {*} value - Value to parse
     * @param {string} fieldName - Name of the field for error messages (optional)
     * @returns {number} Parsed integer
     */
    parseInteger(value, fieldName = null) {
        const decimal = this.parseDecimalValue(value, fieldName);
        const integer = Math.floor(Math.abs(decimal)) * (decimal < 0 ? -1 : 1);
        return integer;
    }

    /**
     * Calculates importe from weight and price
     * @param {*} weight - Weight value
     * @param {*} price - Price value
     * @param {string} fieldName - Name of the field for error messages (optional)
     * @returns {number} Calculated importe rounded to 2 decimals
     */
    calculateImporte(weight, price, fieldName = null) {
        const kilos = this.parseDecimalValue(weight, fieldName ? `${fieldName}.weight` : 'weight');
        const precio = this.parseDecimalValue(price, fieldName ? `${fieldName}.price` : 'price');
        const importe = kilos * precio;
        
        if (!Number.isFinite(importe)) {
            throw new ParsingError(
                `Resultado de cálculo de importe no es finito: ${fieldName || 'campo'}`,
                fieldName,
                { weight, price }
            );
        }
        
        return Number(importe.toFixed(2));
    }
}

