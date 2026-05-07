/**
 * ChatGPT Output Validators
 *
 * These validators check the FINAL app format returned by ChatGPT,
 * NOT the Azure intermediate format. They are intentionally lighter than
 * the Azure validators: optional tables are not required, and only critical
 * business fields are enforced.
 *
 * All validators throw ValidationError (same class as Azure validators) so
 * DocumentProcessor's catch block handles them identically.
 */

import { BaseValidator } from './baseValidator';
import { ValidationError } from '@/errors/lonjasErrors';

/**
 * Validates ChatGPT output for AlbaranCofradiaPescadoresSantoCristoDelMar.
 * Expected format: { detalles, tablas: { subastas, servicios }, subtotales }
 *
 * @param {Array} data - Array of documents from ChatGPT (already in final app format)
 * @throws {ValidationError}
 */
export function validateChatGPTAlbaranCofra(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new ValidationError('Se esperaba un array no vacío de documentos (ChatGPT Cofra)');
    }

    const v = new BaseValidator();

    data.forEach((doc, i) => {
        const ctx = `document[${i}]`;

        v.requireObject(doc.detalles, 'detalles', ctx);
        v.requireNonEmptyString(doc.detalles.lonja, 'lonja', `${ctx}.detalles`);
        v.requireNonEmptyString(doc.detalles.numero, 'numero', `${ctx}.detalles`);
        v.requireNonEmptyString(doc.detalles.fecha, 'fecha', `${ctx}.detalles`);

        v.requireObject(doc.tablas, 'tablas', ctx);
        v.requireNonEmptyArray(doc.tablas.subastas, 'subastas', `${ctx}.tablas`);
        v.requireArray(doc.tablas.servicios, 'servicios', `${ctx}.tablas`);

        doc.tablas.subastas.forEach((row, j) => {
            const rowCtx = `${ctx}.tablas.subastas[${j}]`;
            v.requireField(row.kilos, 'kilos', rowCtx);
            v.requireField(row.pescado, 'pescado', rowCtx);
            v.requireField(row.precio, 'precio', rowCtx);
            v.requireField(row.importe, 'importe', rowCtx);
        });

        v.requireObject(doc.subtotales, 'subtotales', ctx);
    });
}

/**
 * Validates ChatGPT output for ListadoComprasLonjaDeIsla.
 * Expected format: { details, tables: { ventas, peces?, vendidurias?, cajas?, tipoVentas? } }
 *
 * @param {Array} data - Array of documents from ChatGPT (already in final app format)
 * @throws {ValidationError}
 */
export function validateChatGPTLonjaDeIsla(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new ValidationError('Se esperaba un array no vacío de documentos (ChatGPT LonjaDeIsla)');
    }

    const v = new BaseValidator();

    data.forEach((doc, i) => {
        const ctx = `document[${i}]`;

        v.requireObject(doc.details, 'details', ctx);
        v.requireNonEmptyString(doc.details.lonja, 'lonja', `${ctx}.details`);
        v.requireNonEmptyString(doc.details.fecha, 'fecha', `${ctx}.details`);

        v.requireObject(doc.tables, 'tables', ctx);
        v.requireNonEmptyArray(doc.tables.ventas, 'ventas', `${ctx}.tables`);

        doc.tables.ventas.forEach((row, j) => {
            const rowCtx = `${ctx}.tables.ventas[${j}]`;
            v.requireField(row.barco, 'barco', rowCtx);
            v.requireField(row.especie, 'especie', rowCtx);
            v.requireField(row.kilos, 'kilos', rowCtx);
            v.requireField(row.importe, 'importe', rowCtx);
        });
    });
}

/**
 * Validates ChatGPT output for ListadoComprasAsocArmadoresPuntaDelMoral.
 * Expected format: { details, tables: { subastas } }
 *
 * @param {Array} data - Array of documents from ChatGPT (already in final app format)
 * @throws {ValidationError}
 */
export function validateChatGPTAsoc(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new ValidationError('Se esperaba un array no vacío de documentos (ChatGPT Asoc)');
    }

    const v = new BaseValidator();

    data.forEach((doc, i) => {
        const ctx = `document[${i}]`;

        v.requireObject(doc.details, 'details', ctx);
        v.requireNonEmptyString(doc.details.lonja, 'lonja', `${ctx}.details`);
        v.requireNonEmptyString(doc.details.fecha, 'fecha', `${ctx}.details`);

        v.requireObject(doc.tables, 'tables', ctx);
        v.requireNonEmptyArray(doc.tables.subastas, 'subastas', `${ctx}.tables`);

        doc.tables.subastas.forEach((row, j) => {
            const rowCtx = `${ctx}.tables.subastas[${j}]`;
            v.requireField(row.barco, 'barco', rowCtx);
            v.requireField(row.especie, 'especie', rowCtx);
            v.requireField(row.pesoNeto, 'pesoNeto', rowCtx);
            v.requireField(row.importe, 'importe', rowCtx);
        });
    });
}
