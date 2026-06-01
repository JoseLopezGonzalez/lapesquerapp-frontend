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
const DOCUMENT_TYPE_CONFIG = {
  listadoComprasAsocArmadoresPuntaDelMoral: {
    label: 'Asoc. Armadores Punta del Moral',
    productos: asocProductos,
    supplierBrisapp: asocArmadoresPuntaDelMoralBrisapp,
    getLines: (doc) => doc.tables?.subastas || [],
    weightKey: 'pesoNeto',
  },
  listadoComprasLonjaDeIsla: {
    label: 'Lonja de Isla',
    productos: lonjaDeIslaProductos,
    supplierBrisapp: lonjaDeIslaBrisapp,
    getLines: (doc) => doc.tables?.ventas || [],
    weightKey: 'kilos',
  },
};

function resolveProduct(especie, productosArray) {
  const normalized = normalizeText(especie);
  if (!normalized) return null;

  const exact = productosArray.find((p) => normalizeText(p.nombre) === normalized);
  if (exact) return exact;

  const partial = productosArray.find((p) => {
    const catName = normalizeText(p.nombre);
    if (!catName) return false;
    return catName.startsWith(normalized) || normalized.startsWith(catName);
  });
  return partial || null;
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
 * @returns {{ supplier: string|null, date: Date|null, notes: string, details: Array, warnings: string[] }}
 */
export function transformDocumentToReceptionData(processedDocument, documentType) {
  const config = DOCUMENT_TYPE_CONFIG[documentType];
  if (!config) {
    throw new Error(`Tipo de documento no soportado para importar recepción: ${documentType}`);
  }

  const fecha = processedDocument.details?.fecha;
  const parsedDate = parseDateFromDocument(fecha);
  const lines = config.getLines(processedDocument);

  const aggregated = new Map();
  const unmatchedSpecies = new Set();

  lines.forEach((linea) => {
    const producto = resolveProduct(linea.especie, config.productos);
    const productId = producto?.codBrisappProducto ? String(producto.codBrisappProducto) : null;

    if (!productId) {
      unmatchedSpecies.add(linea.especie);
      return;
    }

    const weight = parseDecimalValue(linea[config.weightKey]);
    const boxes = Number(linea.cajas) || 0;
    const price = parseDecimalValue(linea.precio);
    const importe = weight * price;

    if (aggregated.has(productId)) {
      const existing = aggregated.get(productId);
      existing.totalWeight += weight;
      existing.totalBoxes += boxes;
      existing.totalImporte += importe;
    } else {
      aggregated.set(productId, {
        product: productId,
        totalWeight: weight,
        totalBoxes: boxes,
        totalImporte: importe,
      });
    }
  });

  const details = Array.from(aggregated.values()).map((agg) => {
    const weightStr = agg.totalWeight > 0 ? String(parseFloat(agg.totalWeight.toFixed(2))) : '';
    const avgPrice =
      agg.totalWeight > 0 ? parseFloat((agg.totalImporte / agg.totalWeight).toFixed(2)) : 0;

    return {
      product: agg.product,
      grossWeight: weightStr,
      boxes: agg.totalBoxes,
      tare: '0',
      netWeight: weightStr,
      price: String(avgPrice),
      lot: '',
    };
  });

  const supplierIdRaw = config.supplierBrisapp.codBrisapp;
  const supplier = supplierIdRaw ? String(supplierIdRaw) : null;

  const warnings =
    unmatchedSpecies.size > 0
      ? [`Líneas no reconocidas: ${Array.from(unmatchedSpecies).join(', ')}`]
      : [];

  return {
    supplier,
    date: parsedDate,
    notes: `Importado desde ${config.label} - ${fecha || 'sin fecha'}`,
    details,
    warnings,
  };
}
