/**
 * Parser for ListadoComprasLonjaDeIsla
 * 
 * IMPORTANT: This parser does NOT transform the data structure.
 * It validates and returns data in the same format as Azure (details, tables in English).
 * This is different from Cofra which transforms to Spanish (detalles, tablas).
 */

import { ParsingError } from '@/errors/lonjasErrors';

/**
 * Parses LonjaDeIsla document data from Azure format
 * Returns data in the same structure (no transformation)
 * @param {Array} validatedAzureData - Array of validated documents from Azure
 * @returns {Array} Array of documents with structure: { details, tables }
 * @throws {ParsingError} If parsing fails
 */
export function parseLonjaDeIslaData(validatedAzureData) {
    // LonjaDeIsla does NOT transform the data - it uses it directly
    // We just validate that the structure is correct and return it as-is
    // However, we ensure optional arrays exist (even if empty) to prevent .map() errors in components
    
    return validatedAzureData.map((document, docIndex) => {
        try {
            // Return data in the same structure (details, tables - no transformation)
            // Ensure optional arrays exist (default to empty array if undefined)
            return {
                details: document.details,
                tables: {
                    ...document.tables,
                    peces: document.tables.peces || [],
                    vendidurias: document.tables.vendidurias || [],
                    cajas: document.tables.cajas || [],
                    tipoVentas: document.tables.tipoVentas || [],
                },
            };
        } catch (error) {
            throw new ParsingError(
                `Error al procesar documento ${docIndex}: ${error.message}`,
                `document[${docIndex}]`,
                document
            );
        }
    });
}

