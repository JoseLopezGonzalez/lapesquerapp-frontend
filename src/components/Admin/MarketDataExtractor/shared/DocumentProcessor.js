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
import { normalizeLonjaDeIslaMultiPage } from "@/helpers/azure/lonjaDeIslaMultiPageNormalizer";
import { normalizeAsocMultiPage } from "@/helpers/azure/asocMultiPageNormalizer";
import { extractWithChatGPT } from "@/services/chatgpt/extractionService";
import { validateChatGPTAlbaranCofra, validateChatGPTLonjaDeIsla, validateChatGPTAsoc } from "@/validators/lonjas/chatgptValidators";

/**
 * Mapeo de tipos de documento a sus procesadores específicos
 */
const DOCUMENT_PROCESSORS = {
    'albaranCofradiaPescadoresSantoCristoDelMar': {
        azureType: 'AlbaranCofradiaPescadoresSantoCristoDelMar',
        validator: validateAlbaranCofraStructure,
        parser: parseAlbaranCofraData,
        chatgptValidator: validateChatGPTAlbaranCofra,
    },
    'listadoComprasLonjaDeIsla': {
        azureType: 'ListadoComprasLonjaDeIsla',
        preprocess: normalizeLonjaDeIslaMultiPage,
        validator: validateLonjaDeIslaStructure,
        parser: parseLonjaDeIslaData,
        chatgptValidator: validateChatGPTLonjaDeIsla,
    },
    'listadoComprasAsocArmadoresPuntaDelMoral': {
        azureType: 'ListadoComprasAsocArmadoresPuntaDelMoral',
        preprocess: normalizeAsocMultiPage,
        validator: validateAsocStructure,
        parser: parseAsocData,
        chatgptValidator: validateChatGPTAsoc,
    }
};

/**
 * Procesa un documento PDF con Azure Document AI
 * 
 * @param {File} file - Archivo PDF a procesar
 * @param {string} documentType - Tipo de documento ('albaranCofradiaPescadoresSantoCristoDelMar', 'listadoComprasLonjaDeIsla', 'listadoComprasAsocArmadoresPuntaDelMoral')
 * @param {'azure' | 'chatgpt'} [provider='azure'] - Proveedor de extracción. Azure usa Document Intelligence; ChatGPT usa gpt-4o vía API route server-side.
 * @returns {Promise<Object>} Objeto con el resultado del procesamiento:
 *   - success: boolean - Indica si el procesamiento fue exitoso
 *   - documentType: string - Tipo de documento procesado
 *   - data: Array - Array de documentos procesados (resultado del parser para Azure, formato final directo para ChatGPT)
 *   - fileName: string - Nombre del archivo procesado
 *   - error?: string - Mensaje de error si success es false
 *   - errorType?: 'validation' | 'parsing' | 'azure' | 'chatgpt' | 'unknown' - Tipo de error
 * @throws {Error} Si el tipo de documento no es válido
 */
export async function processDocument(file, documentType, provider = 'azure') {
    // Validar que el tipo de documento sea válido
    const processor = DOCUMENT_PROCESSORS[documentType];
    if (!processor) {
        throw new Error(`Tipo de documento no válido: ${documentType}`);
    }

    try {
        console.log("[DocumentProcessor] processing file:", {
            fileName: file?.name,
            fileSizeBytes: file?.size,
            fileType: file?.type,
            documentType,
            provider,
        });

        // ChatGPT path — sin Azure, sin normalizador, sin parser
        if (provider === 'chatgpt') {
            return await processWithChatGPT(file, documentType, processor);
        }

        // Azure path (sin cambios)
        // 1. Extraer datos de Azure Document AI
        let azureData = await extractDataWithAzureDocumentAi({
            file,
            documentType: processor.azureType,
        });
        console.log("[DocumentProcessor] azureData before preprocess:", {
            count: Array.isArray(azureData) ? azureData.length : null,
            firstDocumentKeys: azureData?.[0] ? Object.keys(azureData[0]) : [],
        });

        // 2. Normalizar datos multi-página (si el tipo de documento lo requiere)
        if (processor.preprocess) {
            azureData = processor.preprocess(azureData);
            console.log("[DocumentProcessor] azureData after preprocess:", {
                count: Array.isArray(azureData) ? azureData.length : null,
                firstDocumentKeys: azureData?.[0] ? Object.keys(azureData[0]) : [],
            });
        }

        // 3. Validar estructura
        processor.validator(azureData);

        // 4. Parsear datos
        const processedData = processor.parser(azureData);
        console.log("[DocumentProcessor] processedData summary:", {
            count: Array.isArray(processedData) ? processedData.length : null,
            firstDocumentKeys: processedData?.[0] ? Object.keys(processedData[0]) : [],
        });

        // 5. Retornar resultado exitoso
        return {
            success: true,
            documentType,
            data: processedData,
            fileName: file.name
        };

    } catch (error) {
        console.error("[DocumentProcessor] processing failed:", {
            documentType,
            fileName: file?.name,
            errorMessage: error?.message,
            errorType: error?.name,
        });
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
        } else if (error.name === 'Error' && (error.message.includes('ChatGPT') || error.message.includes('OpenAI'))) {
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: error.message,
                errorType: 'chatgpt'
            };
        } else {
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error inesperado al procesar el documento';
            return {
                success: false,
                documentType,
                fileName: file.name,
                error: errorMessage,
                errorType: 'unknown'
            };
        }
    }
}

/**
 * Pipeline ChatGPT: extrae el documento con gpt-4o y valida el formato final.
 * No pasa por normalizador ni parser — ChatGPT devuelve el formato final directamente.
 */
async function processWithChatGPT(file, documentType, processor) {
    const result = await extractWithChatGPT(file, documentType);

    if (!result.success) {
        return {
            success: false,
            documentType,
            fileName: file.name,
            error: result.error || 'Error al procesar con ChatGPT',
            errorType: 'chatgpt',
        };
    }

    // Validates the final app format (throws ValidationError on bad structure)
    processor.chatgptValidator(result.data);

    console.log("[DocumentProcessor] ChatGPT processedData summary:", {
        count: Array.isArray(result.data) ? result.data.length : null,
        firstDocumentKeys: result.data?.[0] ? Object.keys(result.data[0]) : [],
    });

    return {
        success: true,
        documentType,
        data: result.data,
        fileName: file.name,
    };
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

