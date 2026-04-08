/**
 * Document-to-Reception Transformer
 *
 * Bridges extracted lonja document data (from Azure Document AI) into the
 * reception form shape used by useAdminReceptionForm.
 *
 * Reuses the same species catalogs, validators, and parsing utilities as
 * the MarketDataExtractor export flow so any future change to extraction
 * logic automatically propagates here.
 */

import { parseDecimalValue } from '@/exportHelpers/common';
import { normalizeText } from '@/helpers/formats/texts';
import {
    productos as asocProductos,
    asocArmadoresPuntaDelMoralBrisapp,
} from '@/components/Admin/MarketDataExtractor/ListadoComprasAsocPuntaDelMoral/exportData';
import {
    productos as lonjaDeIslaProductos,
    lonjaDeIslaBrisapp,
} from '@/components/Admin/MarketDataExtractor/ListadoComprasLonjaDeIsla/exportData';
import { validateAsocSpeciesForExport } from '@/exportHelpers/asocExportHelper';
import { validateLonjaDeIslaSpeciesForExport } from '@/exportHelpers/lonjaDeIslaExportHelper';

const DOCUMENT_TYPE_CONFIG = {
    listadoComprasAsocArmadoresPuntaDelMoral: {
        label: 'Asoc. Armadores Punta del Moral',
        productos: asocProductos,
        supplierBrisapp: asocArmadoresPuntaDelMoralBrisapp,
        validate: validateAsocSpeciesForExport,
        getLines: (doc) => doc.tables?.subastas || [],
        weightKey: 'pesoNeto',
    },
    listadoComprasLonjaDeIsla: {
        label: 'Lonja de Isla',
        productos: lonjaDeIslaProductos,
        supplierBrisapp: lonjaDeIslaBrisapp,
        validate: validateLonjaDeIslaSpeciesForExport,
        getLines: (doc) => doc.tables?.ventas || [],
        weightKey: 'kilos',
    },
};

function resolveProduct(especie, productosArray) {
    const normalized = normalizeText(especie);
    return productosArray.find((p) => normalizeText(p.nombre) === normalized) || null;
}

function parseDateFromDocument(fechaStr) {
    if (!fechaStr) return null;

    const isoMatch = String(fechaStr).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
        return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    const euMatch = String(fechaStr).match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (euMatch) {
        return new Date(Number(euMatch[3]), Number(euMatch[2]) - 1, Number(euMatch[1]));
    }

    const fallback = new Date(fechaStr);
    return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Transforms a processed lonja document into reception form data.
 *
 * @param {Object} processedDocument - Single document from processDocument().data[0]
 * @param {string} documentType - 'listadoComprasAsocArmadoresPuntaDelMoral' | 'listadoComprasLonjaDeIsla'
 * @returns {{ supplier: string|null, date: Date|null, notes: string, details: Array }}
 * @throws {Error} If species validation fails (unknown species in document)
 */
export function transformDocumentToReceptionData(processedDocument, documentType) {
    const config = DOCUMENT_TYPE_CONFIG[documentType];
    if (!config) {
        throw new Error(`Tipo de documento no soportado para importar recepción: ${documentType}`);
    }

    config.validate(processedDocument);

    const fecha = processedDocument.details?.fecha;
    const parsedDate = parseDateFromDocument(fecha);
    const lines = config.getLines(processedDocument);

    const details = lines.map((linea) => {
        const producto = resolveProduct(linea.especie, config.productos);
        const weight = parseDecimalValue(linea[config.weightKey]);
        const weightStr = weight > 0 ? String(weight) : '';

        return {
            product: producto?.codBrisappProducto ? String(producto.codBrisappProducto) : null,
            grossWeight: weightStr,
            boxes: Number(linea.cajas) || 0,
            tare: '0',
            netWeight: weightStr,
            price: String(parseDecimalValue(linea.precio)),
            lot: '',
        };
    });

    const supplierIdRaw = config.supplierBrisapp.codBrisapp;
    const supplier = supplierIdRaw ? String(supplierIdRaw) : null;

    return {
        supplier,
        date: parsedDate,
        notes: `Importado desde ${config.label} - ${fecha || 'sin fecha'}`,
        details,
    };
}
