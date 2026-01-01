/**
 * Parser for AlbaranCofra (Cofradía Pescadores Santo Cristo del Mar)
 * 
 * Transforms Azure Document AI data into the format expected by Cofra components.
 * 
 * IMPORTANT: This parser maintains the same transformation logic as the original
 * implementation to ensure compatibility with existing components:
 * - details (English) → detalles (Spanish)
 * - objects → subtotales (transformed structure)
 */

import { BaseParser } from './baseParser';
import { ParsingError } from '@/errors/lonjasErrors';
import { parseArmador } from './helpers/parseArmador';
import { parseCodBarco } from './helpers/parseBarco';
import { parseCajas } from './helpers/parseCajas';

/**
 * Parses Cofra document data from Azure format to application format
 * @param {Array} validatedAzureData - Array of validated documents from Azure
 * @returns {Array} Array of parsed documents with structure: { detalles, tablas, subtotales }
 * @throws {ParsingError} If parsing fails
 */
export function parseAlbaranCofraData(validatedAzureData) {
    const parser = new BaseParser();

    return validatedAzureData.map((document, docIndex) => {
        try {
            return {
                detalles: parseDetails(document.details, docIndex, parser),
                tablas: {
                    subastas: parseSubastas(document.tables.subastas, docIndex, parser),
                    servicios: parseServicios(document.tables.servicios, docIndex, parser),
                },
                subtotales: parseSubtotales(document.objects, docIndex),
            };
        } catch (error) {
            if (error instanceof ParsingError) {
                throw error;
            }
            throw new ParsingError(
                `Error al parsear documento ${docIndex}: ${error.message}`,
                `document[${docIndex}]`,
                document
            );
        }
    });
}

/**
 * Parses details section (English → Spanish keys)
 * @param {Object} details - Details object from Azure
 * @param {number} docIndex - Document index for error messages
 * @param {BaseParser} parser - BaseParser instance
 * @returns {Object} Parsed details with Spanish keys
 */
function parseDetails(details, docIndex, parser) {
    try {
        return {
            lonja: details.lonja,
            cifLonja: details.cif_lonja,
            numero: details.numero,
            fecha: details.fecha,
            ejercicio: details.ejercicio || '',
            comprador: details.comprador || '',
            numeroComprador: details.numero_comprador || '',
            cifComprador: details.cif_comprador || '',
            importeTotal: details.importe_total || '',
        };
    } catch (error) {
        throw new ParsingError(
            `Error al parsear detalles del documento ${docIndex}: ${error.message}`,
            `document[${docIndex}].details`,
            details
        );
    }
}

/**
 * Parses subastas table
 * @param {Array} subastas - Array of subasta rows
 * @param {number} docIndex - Document index for error messages
 * @param {BaseParser} parser - BaseParser instance
 * @returns {Array} Parsed subastas array
 */
function parseSubastas(subastas, docIndex, parser) {
    return subastas.map((row, rowIndex) => {
        try {
            // Parse armador
            let nombreArmador, cifArmador;
            try {
                const armadorParsed = parseArmador(row.Armador);
                nombreArmador = armadorParsed.nombre;
                cifArmador = armadorParsed.cif;
            } catch (error) {
                throw new ParsingError(
                    `Error al parsear armador en fila ${rowIndex}: ${error.message}`,
                    `document[${docIndex}].tables.subastas[${rowIndex}].Armador`,
                    row.Armador
                );
            }

            // Parse cod barco
            let cod, barco;
            try {
                const barcoParsed = parseCodBarco(row['Cod Barco']);
                cod = barcoParsed.cod;
                barco = barcoParsed.barco;
            } catch (error) {
                throw new ParsingError(
                    `Error al parsear código de barco en fila ${rowIndex}: ${error.message}`,
                    `document[${docIndex}].tables.subastas[${rowIndex}]['Cod Barco']`,
                    row['Cod Barco']
                );
            }

            // Parse cajas
            let cantidadCajas, tipoCaja;
            try {
                const cajasParsed = parseCajas(row.Cajas);
                cantidadCajas = cajasParsed.cantidad;
                tipoCaja = cajasParsed.tipo;
            } catch (error) {
                throw new ParsingError(
                    `Error al parsear cajas en fila ${rowIndex}: ${error.message}`,
                    `document[${docIndex}].tables.subastas[${rowIndex}].Cajas`,
                    row.Cajas
                );
            }

            return {
                cajas: cantidadCajas,
                tipoCaja,
                kilos: row.Kilos,
                pescado: row.Pescado,
                cod: cod,
                barco: barco,
                armador: nombreArmador,
                cifArmador,
                precio: row.Precio,
                importe: row.Importe
            };
        } catch (error) {
            if (error instanceof ParsingError) {
                throw error;
            }
            throw new ParsingError(
                `Error al parsear fila ${rowIndex} de subastas: ${error.message}`,
                `document[${docIndex}].tables.subastas[${rowIndex}]`,
                row
            );
        }
    });
}

/**
 * Parses servicios table
 * @param {Array} servicios - Array of servicio rows
 * @param {number} docIndex - Document index for error messages
 * @param {BaseParser} parser - BaseParser instance
 * @returns {Array} Parsed servicios array
 */
function parseServicios(servicios, docIndex, parser) {
    return servicios.map((row, rowIndex) => {
        try {
            return {
                codigo: row.Código,
                descripcion: row.Descripción,
                fecha: row.Fecha,
                iva: row['%IVA'],
                rec: row['%REC'] || null, // %REC es opcional - puede no estar presente
                unidades: row.Unidades,
                precio: row.Precio,
                importe: row.Importe
            };
        } catch (error) {
            throw new ParsingError(
                `Error al parsear fila ${rowIndex} de servicios: ${error.message}`,
                `document[${docIndex}].tables.servicios[${rowIndex}]`,
                row
            );
        }
    });
}

/**
 * Parses subtotales from objects section
 * @param {Object} objects - Objects section from Azure
 * @param {number} docIndex - Document index for error messages
 * @returns {Object} Parsed subtotales structure
 */
function parseSubtotales(objects, docIndex) {
    try {
        return {
            pesca: {
                subtotal: objects.subtotales_pesca.columna.total_pesca,
                iva: objects.subtotales_pesca.columna.iva_pesca,
                total: objects.subtotales_pesca.columna.total
            },
            servicios: {
                subtotal: objects.subtotales_servicios.columna.servicios,
                iva: objects.subtotales_servicios.columna.iva_servicios,
                total: objects.subtotales_servicios.columna.total
            },
            cajas: {
                subtotal: objects.subtotales_cajas.columna.cajas,
                iva: objects.subtotales_cajas.columna.iva_cajas,
                total: objects.subtotales_cajas.columna.total
            },
        };
    } catch (error) {
        throw new ParsingError(
            `Error al parsear subtotales del documento ${docIndex}: ${error.message}`,
            `document[${docIndex}].objects`,
            objects
        );
    }
}

