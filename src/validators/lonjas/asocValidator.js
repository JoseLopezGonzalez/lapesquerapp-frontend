/**
 * Validator for ListadoComprasAsocArmadoresPuntaDelMoral
 * 
 * Validates the structure of Azure Document AI data for Asoc documents
 * before processing.
 * 
 * IMPORTANT: Asoc does NOT transform the data structure (unlike Cofra).
 * It uses data directly from Azure with keys in English (details, tables).
 */

import { BaseValidator } from './baseValidator';
import { ValidationError } from '@/errors/lonjasErrors';

/**
 * Validates the structure of Asoc document data from Azure
 * @param {Array} azureData - Array of documents from parseAzureDocumentAIResult
 * @throws {ValidationError} If validation fails
 */
export function validateAsocStructure(azureData) {
    const validator = new BaseValidator();

    // Validar estructura raíz
    if (!azureData || !Array.isArray(azureData) || azureData.length === 0) {
        throw new ValidationError('Se esperaba un array de documentos de Azure no vacío');
    }

    // Validar cada documento
    azureData.forEach((document, index) => {
        validateDocument(document, index, validator);
    });
}

/**
 * Validates a single Asoc document
 * @param {Object} document - Document object from Azure
 * @param {number} index - Document index for error messages
 * @param {BaseValidator} validator - BaseValidator instance
 * @throws {ValidationError} If validation fails
 */
function validateDocument(document, index, validator) {
    // Validar details (mantener inglés, sin transformar)
    validator.requireObject(document.details, 'details', `document[${index}]`);
    validator.requireNonEmptyString(document.details.lonja, 'lonja', `document[${index}].details`);
    validator.requireNonEmptyString(document.details.fecha, 'fecha', `document[${index}].details`);
    validator.requireNonEmptyString(document.details.tipoSubasta, 'tipoSubasta', `document[${index}].details`);
    // Campos opcionales: cifComprador, comprador, importeTotal
    // Se validan si existen, pero pueden ser undefined/null

    // Validar tables (mantener inglés, sin transformar)
    validator.requireObject(document.tables, 'tables', `document[${index}]`);
    validator.requireNonEmptyArray(document.tables.subastas, 'subastas', `document[${index}].tables`);

    // Validar estructura de cada fila de subastas
    document.tables.subastas.forEach((row, rowIndex) => {
        validator.requireField(row.barco, 'barco', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.matricula, 'matricula', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.cajas, 'cajas', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.especie, 'especie', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.pesoNeto, 'pesoNeto', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.precio, 'precio', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.importe, 'importe', `document[${index}].tables.subastas[${rowIndex}]`);
    });
}

