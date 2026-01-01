/**
 * Document Processor - Procesamiento de documentos de lonja
 * 
 * Función genérica para procesar documentos que extrae datos de Azure,
 * valida la estructura y parsea los datos. Reutilizable tanto para modo
 * individual como masivo.
 */

import { extractDataWithAzureDocumentAi } from "@/services/azure";
import { validateAlbaranCofraStructure, validateLonjaDeIslaStructure, validateAsocStructure } from "@/validators/lonjas";
import { parseAlbaranCofraData, parseLonjaDeIslaData, parseAsocData } from "@/parsers/lonjas";
import { ValidationError, ParsingError } from "@/errors/lonjasErrors";

/**
 * Mapeo de tipos de documento a sus procesadores específicos
 */
const DOCUMENT_PROCESSORS = {
    'albaranCofradiaPescadoresSantoCristoDelMar': {
        azureType: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
        validator: validateAlbaranCofraStructure,
        parser: parseAlbaranCofraData
    },
    'listadoComprasLonjaDeIsla': {
        azureType: 'ListadoComprasLonjaDeIsla',
        validator: validateLonjaDeIslaStructure,
        parser: parseLonjaDeIslaData
    },
    'listadoComprasAsocArmadoresPuntaDelMoral': {
        azureType: 'ListadoComprasAsocArmadoresPuntaDelMoral',
        validator: validateAsocStructure,
        parser: parseAsocData
    }
};

/**
 * Procesa un documento PDF con Azure Document AI
 * 
 * @param {File} file - Archivo PDF a procesar
 * @param {string} documentType - Tipo de documento ('albaranCofradiaPescadoresSantoCristoDelMar', 'listadoComprasLonjaDeIsla', 'listadoComprasAsocArmadoresPuntaDelMoral')
 * @returns {Promise<Object>} Objeto con el resultado del procesamiento:
 *   - success: boolean - Indica si el procesamiento fue exitoso
 *   - documentType: string - Tipo de documento procesado
 *   - data: Array - Array de documentos procesados (resultado del parser)
 *   - fileName: string - Nombre del archivo procesado
 *   - error?: string - Mensaje de error si success es false
 *   - errorType?: 'validation' | 'parsing' | 'azure' | 'unknown' - Tipo de error
 * @throws {Error} Si el tipo de documento no es válido
 */
export async function processDocument(file, documentType) {
    // Validar que el tipo de documento sea válido
    const processor = DOCUMENT_PROCESSORS[documentType];
    if (!processor) {
        throw new Error(`Tipo de documento no válido: ${documentType}`);
    }

    try {
        // 1. Extraer datos de Azure Document AI
        const azureData = await extractDataWithAzureDocumentAi({
            file,
            documentType: processor.azureType,
        });

        // 2. Validar estructura
        processor.validator(azureData);

        // 3. Parsear datos
        const processedData = processor.parser(azureData);

        // 4. Retornar resultado exitoso
        return {
            success: true,
            documentType,
            data: processedData,
            fileName: file.name
        };

    } catch (error) {
        // Manejar errores específicos
        if (error instanceof ValidationError) {
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: error.message,
                errorType: 'validation'
            };
        } else if (error instanceof ParsingError) {
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: error.message,
                errorType: 'parsing'
            };
        } else if (error.name === 'Error' && error.message.includes('Azure')) {
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: 'Error al comunicarse con Azure Document AI',
                errorType: 'azure'
            };
        } else {
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: error.message || 'Error inesperado al procesar el documento',
                errorType: 'unknown'
            };
        }
    }
}

/**
 * Obtiene el tipo de documento de Azure correspondiente
 * 
 * @param {string} documentType - Tipo de documento interno
 * @returns {string} Tipo de documento de Azure
 */
export function getAzureDocumentType(documentType) {
    const processor = DOCUMENT_PROCESSORS[documentType];
    if (!processor) {
        throw new Error(`Tipo de documento no válido: ${documentType}`);
    }
    return processor.azureType;
}

/**
 * Verifica si un tipo de documento es válido
 * 
 * @param {string} documentType - Tipo de documento a verificar
 * @returns {boolean} true si el tipo es válido
 */
export function isValidDocumentType(documentType) {
    return documentType in DOCUMENT_PROCESSORS;
}

/**
 * Obtiene todos los tipos de documento disponibles
 * 
 * @returns {string[]} Array con los tipos de documento disponibles
 */
export function getAvailableDocumentTypes() {
    return Object.keys(DOCUMENT_PROCESSORS);
}

