/**
 * Multi-page normalizer for Lonja de Isla documents.
 *
 * Azure Document AI sometimes merges table rows that span a page boundary
 * into a single entry whose field values are newline-concatenated
 * (e.g. codBarco: "920\n1052\n708"). This module detects and splits those
 * merged rows back into individual entries, then optionally cross-validates
 * species totals against the `peces` summary table.
 *
 * It also handles the (less common) case where Azure returns multiple
 * top-level documents — one per page — by merging them into a single
 * document before applying the split.
 */

import { parseDecimalValue } from '@/exportHelpers/common';
import { normalizeText } from '@/helpers/formats/texts';

// ─── Row splitting ──────────────────────────────────────────────────────────

/**
 * Returns true when at least one field in the row contains a line break,
 * which signals that Azure merged several physical rows into one.
 */
function isMergedRow(row) {
  return Object.values(row).some((v) => typeof v === 'string' && v.includes('\n'));
}

/**
 * Splits a single merged row into N individual rows by separating each field
 * on "\n", then zipping the parts back together.
 *
 * Fields that are NOT newline-separated are replicated across all sub-rows
 * so that downstream validators (which require every field to be truthy)
 * continue to pass.
 */
function splitMergedRow(row) {
  if (!isMergedRow(row)) return [row];

  const fieldParts = {};
  let maxParts = 1;

  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string' && value.includes('\n')) {
      const parts = value.split('\n').map((p) => p.trim());
      fieldParts[key] = parts;
      maxParts = Math.max(maxParts, parts.length);
    } else {
      fieldParts[key] = null; // sentinel: replicate original value
    }
  }

  const rows = [];
  for (let i = 0; i < maxParts; i++) {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      const parts = fieldParts[key];
      newRow[key] =
        parts === null
          ? value // replicate single value
          : i < parts.length
            ? parts[i]
            : ''; // pick split part or pad
    }
    rows.push(newRow);
  }

  return rows;
}

/**
 * Determines whether a reconstructed ventas row is valid enough to keep.
 * Rows where species or kilos are missing / garbage are discarded.
 */
function isValidVentaRow(row) {
  const especie = (row.especie || '').trim();
  if (!especie || especie === '/' || especie === '-') return false;

  const kilos = (row.kilos || '').trim();
  if (!kilos) return false;

  return true;
}

/**
 * Processes the ventas array: splits any merged rows and filters garbage.
 */
function splitMergedVentasRows(ventas) {
  if (!Array.isArray(ventas)) return ventas;

  const result = [];
  for (const row of ventas) {
    const splitRows = splitMergedRow(row);
    for (const r of splitRows) {
      if (isValidVentaRow(r)) {
        result.push(r);
      }
    }
  }
  return result;
}

/**
 * Validates a reconstructed peces row. Requires descripcion and kilos
 * (both mandatory in the downstream validator).
 */
function isValidPecesRow(row) {
  const descripcion = (row.descripcion || '').trim();
  if (!descripcion || descripcion === '/' || descripcion === '-') return false;

  const kilos = (row.kilos || '').trim();
  if (!kilos) return false;

  return true;
}

/**
 * Validates a reconstructed vendidurias row. Requires vendiduria, kilos,
 * and importe (all mandatory in the downstream validator).
 */
function isValidVendiduriasRow(row) {
  if (!(row.vendiduria || '').trim()) return false;
  if (!(row.kilos || '').trim()) return false;
  if (!(row.importe || '').trim()) return false;
  return true;
}

/**
 * Validates a reconstructed cajas row. Requires descripcion and cajas
 * (both mandatory in the downstream validator).
 */
function isValidCajasRow(row) {
  if (!(row.descripcion || '').trim()) return false;
  if (!(row.cajas || '').trim()) return false;
  return true;
}

/**
 * Validates a reconstructed tipoVentas row. Requires descripcion and cajas
 * (both mandatory in the downstream validator).
 */
function isValidTipoVentasRow(row) {
  if (!(row.descripcion || '').trim()) return false;
  if (!(row.cajas || '').trim()) return false;
  return true;
}

/**
 * Per-table row validators aligned with the downstream Lonja de Isla
 * validator's required fields.
 */
const TABLE_ROW_VALIDATORS = {
  peces: isValidPecesRow,
  vendidurias: isValidVendiduriasRow,
  cajas: isValidCajasRow,
  tipoVentas: isValidTipoVentasRow,
};

/**
 * Generic fallback: row is valid if at least one field has content.
 */
function hasAnyContent(row) {
  return Object.values(row).some((v) => typeof v === 'string' && v.trim() !== '');
}

/**
 * Splits merged rows in a table array, filtering with a table-specific
 * validator when available, or a generic "any content" check otherwise.
 */
function splitMergedTableRows(rows, tableName) {
  if (!Array.isArray(rows)) return rows;

  const isValid = TABLE_ROW_VALIDATORS[tableName] || hasAnyContent;
  const result = [];
  for (const row of rows) {
    const splitRows = splitMergedRow(row);
    for (const r of splitRows) {
      if (isValid(r)) result.push(r);
    }
  }
  return result;
}

// ─── Multi-document merge ───────────────────────────────────────────────────

/**
 * Merges N Azure documents (one per page) into a single logical document.
 * Takes header details from the first doc and concatenates every table array.
 */
function mergeDocuments(docs) {
  if (docs.length === 1) return docs[0];

  const merged = {
    details: { ...docs[0].details },
    tables: {},
    objects: { ...(docs[0].objects || {}) },
  };

  const allTableKeys = new Set();
  docs.forEach((d) => {
    Object.keys(d.tables || {}).forEach((k) => allTableKeys.add(k));
  });

  for (const key of allTableKeys) {
    merged.tables[key] = docs.flatMap((d) => (Array.isArray(d.tables?.[key]) ? d.tables[key] : []));
  }

  for (let i = 1; i < docs.length; i++) {
    if (docs[i].objects) {
      Object.assign(merged.objects, docs[i].objects);
    }
  }

  return merged;
}

// ─── Cross-validation against peces ─────────────────────────────────────────

function crossValidateWithPeces(ventas, peces) {
  if (!Array.isArray(peces) || peces.length === 0) return;

  const ventasBySpecies = new Map();
  for (const v of ventas) {
    const key = normalizeText(v.especie);
    if (!key) continue;
    const prev = ventasBySpecies.get(key) || 0;
    ventasBySpecies.set(key, prev + parseDecimalValue(v.kilos));
  }

  for (const p of peces) {
    const key = normalizeText(p.descripcion);
    if (!key) continue;
    const pecesKilos = parseDecimalValue(p.kilos);
    const ventasKilos = ventasBySpecies.get(key) || 0;
    const diff = Math.abs(pecesKilos - ventasKilos);
    if (diff > 0.5) {
      console.warn(
        `[MultiPage] Discrepancia en "${p.descripcion}": ` +
          `peces=${pecesKilos} kg, ventas sumadas=${ventasKilos.toFixed(2)} kg ` +
          `(Δ ${diff.toFixed(2)} kg)`
      );
    }
  }
}

// ─── Public entry point ─────────────────────────────────────────────────────

/**
 * Normalizes a Lonja de Isla Azure result for multi-page support.
 *
 * 1. Merges multiple Azure documents into one (if >1).
 * 2. Splits any merged ventas rows caused by page-boundary concatenation.
 * 3. Cross-validates species totals against the peces summary table.
 *
 * @param {Array} azureData - Array of documents from parseAzureDocumentAIResult
 * @returns {Array} Single-element array with the normalized document
 */
export function normalizeLonjaDeIslaMultiPage(azureData) {
  if (!Array.isArray(azureData) || azureData.length === 0) return azureData;

  const doc = mergeDocuments(azureData);

  if (doc.tables) {
    doc.tables.ventas = splitMergedVentasRows(doc.tables.ventas);

    const secondaryTables = ['peces', 'vendidurias', 'cajas', 'tipoVentas'];
    for (const tableName of secondaryTables) {
      if (Array.isArray(doc.tables[tableName])) {
        doc.tables[tableName] = splitMergedTableRows(doc.tables[tableName], tableName);
      }
    }
  }

  crossValidateWithPeces(doc.tables?.ventas || [], doc.tables?.peces || []);

  return [doc];
}
