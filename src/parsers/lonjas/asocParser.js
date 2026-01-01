/**
 * Parser for ListadoComprasAsocArmadoresPuntaDelMoral
 * 
 * IMPORTANT: This parser does NOT transform the data structure.
 * It validates and returns data in the same format as Azure (details, tables in English).
 * This is different from Cofra which transforms to Spanish (detalles, tablas).
 */

import { ParsingError } from '@/errors/lonjasErrors';

/**
 * Parses Asoc document data from Azure format
 * Returns data in the same structure (no transformation)
 * @param {Array} validatedAzureData - Array of validated documents from Azure
 * @returns {Array} Array of documents with structure: { details, tables }
 * @throws {ParsingError} If parsing fails
 */
export function parseAsocData(validatedAzureData) {
    // Asoc does NOT transform the data - it uses it directly
    // We just validate that the structure is correct and return it as-is
    
    return validatedAzureData.map((document, docIndex) => {
        try {
            // Return data in the same structure (details, tables - no transformation)
            return {
                details: document.details,
                tables: document.tables,
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

