/**
 * Validator for AlbaranCofra (Cofradía Pescadores Santo Cristo del Mar)
 * 
 * Validates the structure of Azure Document AI data for Cofra documents
 * before parsing.
 */

import { BaseValidator } from './baseValidator';
import { ValidationError } from '@/errors/lonjasErrors';

/**
 * Validates the structure of Cofra document data from Azure
 * @param {Array} azureData - Array of documents from parseAzureDocumentAIResult
 * @throws {ValidationError} If validation fails
 */
export function validateAlbaranCofraStructure(azureData) {
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
 * Validates a single Cofra document
 * @param {Object} document - Document object from Azure
 * @param {number} index - Document index for error messages
 * @param {BaseValidator} validator - BaseValidator instance
 * @throws {ValidationError} If validation fails
 */
function validateDocument(document, index, validator) {
    // Validar details
    validator.requireObject(document.details, 'details', `document[${index}]`);
    validator.requireNonEmptyString(document.details.lonja, 'lonja', `document[${index}].details`);
    validator.requireNonEmptyString(document.details.cif_lonja, 'cif_lonja', `document[${index}].details`);
    validator.requireNonEmptyString(document.details.numero, 'numero', `document[${index}].details`);
    validator.requireNonEmptyString(document.details.fecha, 'fecha', `document[${index}].details`);
    // ejercicio, comprador, numero_comprador, cif_comprador, importe_total are optional
    // They can be undefined/null and will be handled with default values in the parser

    // Validar tables
    validator.requireObject(document.tables, 'tables', `document[${index}]`);
    validator.requireNonEmptyArray(document.tables.subastas, 'subastas', `document[${index}].tables`);
    validator.requireNonEmptyArray(document.tables.servicios, 'servicios', `document[${index}].tables`);

    // Validar estructura de cada fila de subastas
    document.tables.subastas.forEach((row, rowIndex) => {
        validator.requireNonEmptyString(row.Armador, 'Armador', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireNonEmptyString(row['Cod Barco'], 'Cod Barco', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.Cajas, 'Cajas', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.Kilos, 'Kilos', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.Pescado, 'Pescado', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.Precio, 'Precio', `document[${index}].tables.subastas[${rowIndex}]`);
        validator.requireField(row.Importe, 'Importe', `document[${index}].tables.subastas[${rowIndex}]`);
    });

                // Validar estructura de cada fila de servicios
                document.tables.servicios.forEach((row, rowIndex) => {
                    validator.requireField(row.Código, 'Código', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row.Descripción, 'Descripción', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row.Fecha, 'Fecha', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row['%IVA'], '%IVA', `document[${index}].tables.servicios[${rowIndex}]`);
                    // %REC es opcional - puede no estar presente en algunos documentos
                    // validator.requireField(row['%REC'], '%REC', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row.Unidades, 'Unidades', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row.Precio, 'Precio', `document[${index}].tables.servicios[${rowIndex}]`);
                    validator.requireField(row.Importe, 'Importe', `document[${index}].tables.servicios[${rowIndex}]`);
                });

    // Validar objects (subtotales)
    validator.requireObject(document.objects, 'objects', `document[${index}]`);
    
    // Validar subtotales_pesca
    validator.requireObject(document.objects.subtotales_pesca, 'subtotales_pesca', `document[${index}].objects`);
    validator.requireObject(document.objects.subtotales_pesca.columna, 'columna', `document[${index}].objects.subtotales_pesca`);
    validator.requireField(document.objects.subtotales_pesca.columna.total_pesca, 'total_pesca', `document[${index}].objects.subtotales_pesca.columna`);
    validator.requireField(document.objects.subtotales_pesca.columna.iva_pesca, 'iva_pesca', `document[${index}].objects.subtotales_pesca.columna`);
    validator.requireField(document.objects.subtotales_pesca.columna.total, 'total', `document[${index}].objects.subtotales_pesca.columna`);

    // Validar subtotales_servicios
    validator.requireObject(document.objects.subtotales_servicios, 'subtotales_servicios', `document[${index}].objects`);
    validator.requireObject(document.objects.subtotales_servicios.columna, 'columna', `document[${index}].objects.subtotales_servicios`);
    validator.requireField(document.objects.subtotales_servicios.columna.servicios, 'servicios', `document[${index}].objects.subtotales_servicios.columna`);
    validator.requireField(document.objects.subtotales_servicios.columna.iva_servicios, 'iva_servicios', `document[${index}].objects.subtotales_servicios.columna`);
    validator.requireField(document.objects.subtotales_servicios.columna.total, 'total', `document[${index}].objects.subtotales_servicios.columna`);

    // Validar subtotales_cajas
    validator.requireObject(document.objects.subtotales_cajas, 'subtotales_cajas', `document[${index}].objects`);
    validator.requireObject(document.objects.subtotales_cajas.columna, 'columna', `document[${index}].objects.subtotales_cajas`);
    validator.requireField(document.objects.subtotales_cajas.columna.cajas, 'cajas', `document[${index}].objects.subtotales_cajas.columna`);
    validator.requireField(document.objects.subtotales_cajas.columna.iva_cajas, 'iva_cajas', `document[${index}].objects.subtotales_cajas.columna`);
    validator.requireField(document.objects.subtotales_cajas.columna.total, 'total', `document[${index}].objects.subtotales_cajas.columna`);
}

