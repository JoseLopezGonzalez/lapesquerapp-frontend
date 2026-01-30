/**
 * Validator for ListadoComprasLonjaDeIsla
 * 
 * Validates the structure of Azure Document AI data for LonjaDeIsla documents
 * before processing.
 * 
 * IMPORTANT: LonjaDeIsla does NOT transform the data structure (unlike Cofra).
 * It uses data directly from Azure with keys in English (details, tables).
 */

import { BaseValidator } from './baseValidator';
import { ValidationError } from '@/errors/lonjasErrors';

/**
 * Validates the structure of LonjaDeIsla document data from Azure
 * @param {Array} azureData - Array of documents from parseAzureDocumentAIResult
 * @throws {ValidationError} If validation fails
 */
export function validateLonjaDeIslaStructure(azureData) {
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
 * Validates a single LonjaDeIsla document
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
    // Campos opcionales: cifComprador, comprador, numeroComprador, importeTotal
    // Se validan si existen, pero pueden ser undefined/null

    // Validar tables (mantener inglés, sin transformar)
    validator.requireObject(document.tables, 'tables', `document[${index}]`);
    
    // Validar ventas (array)
    validator.requireNonEmptyArray(document.tables.ventas, 'ventas', `document[${index}].tables`);
    
    // Validar estructura de cada fila de ventas
    document.tables.ventas.forEach((row, rowIndex) => {
        validator.requireField(row.venta, 'venta', `document[${index}].tables.ventas[${rowIndex}]`);
        validator.requireField(row.barco, 'barco', `document[${index}].tables.ventas[${rowIndex}]`);
        // matricula es opcional (no se usa en el componente ni en la exportación)
        validator.requireField(row.cajas, 'cajas', `document[${index}].tables.ventas[${rowIndex}]`);
        validator.requireField(row.especie, 'especie', `document[${index}].tables.ventas[${rowIndex}]`);
        validator.requireField(row.kilos, 'kilos', `document[${index}].tables.ventas[${rowIndex}]`);
        validator.requireField(row.precio, 'precio', `document[${index}].tables.ventas[${rowIndex}]`);
        validator.requireField(row.importe, 'importe', `document[${index}].tables.ventas[${rowIndex}]`);
        // nrsi y matricula son opcionales
    });

    // Validar peces (array)
    if (document.tables.peces) {
        validator.requireArray(document.tables.peces, 'peces', `document[${index}].tables`);
        // Validar estructura de cada fila de peces (si existe)
        document.tables.peces.forEach((row, rowIndex) => {
            validator.requireField(row.fao, 'fao', `document[${index}].tables.peces[${rowIndex}]`);
            validator.requireField(row.descripcion, 'descripcion', `document[${index}].tables.peces[${rowIndex}]`);
            // cajas es opcional (Azure no siempre lo extrae correctamente)
            validator.requireField(row.kilos, 'kilos', `document[${index}].tables.peces[${rowIndex}]`);
            validator.requireField(row.importe, 'importe', `document[${index}].tables.peces[${rowIndex}]`);
        });
    }

    // Validar vendidurias (array, puede estar vacío)
    if (document.tables.vendidurias) {
        validator.requireArray(document.tables.vendidurias, 'vendidurias', `document[${index}].tables`);
        // Validar estructura de cada fila de vendidurias (si existe)
        document.tables.vendidurias.forEach((row, rowIndex) => {
            validator.requireField(row.vendiduria, 'vendiduria', `document[${index}].tables.vendidurias[${rowIndex}]`);
            validator.requireField(row.cajas, 'cajas', `document[${index}].tables.vendidurias[${rowIndex}]`);
            validator.requireField(row.kilos, 'kilos', `document[${index}].tables.vendidurias[${rowIndex}]`);
            validator.requireField(row.importe, 'importe', `document[${index}].tables.vendidurias[${rowIndex}]`);
        });
    }

    // Validar cajas (array, puede estar vacío)
    if (document.tables.cajas) {
        validator.requireArray(document.tables.cajas, 'cajas', `document[${index}].tables`);
        // Validar estructura de cada fila de cajas (si existe)
        document.tables.cajas.forEach((row, rowIndex) => {
            validator.requireField(row.descripcion, 'descripcion', `document[${index}].tables.cajas[${rowIndex}]`);
            validator.requireField(row.cajas, 'cajas', `document[${index}].tables.cajas[${rowIndex}]`);
            // importe es opcional (Azure no siempre lo devuelve)
        });
    }

    // Validar tipoVentas (array, puede estar vacío)
    if (document.tables.tipoVentas) {
        validator.requireArray(document.tables.tipoVentas, 'tipoVentas', `document[${index}].tables`);
        // Validar estructura de cada fila de tipoVentas (si existe)
        document.tables.tipoVentas.forEach((row, rowIndex) => {
            // cod es opcional (no siempre está presente en los documentos)
            validator.requireField(row.descripcion, 'descripcion', `document[${index}].tables.tipoVentas[${rowIndex}]`);
            validator.requireField(row.cajas, 'cajas', `document[${index}].tables.tipoVentas[${rowIndex}]`);
            // importe es opcional (Azure no siempre lo devuelve)
        });
    }
}

