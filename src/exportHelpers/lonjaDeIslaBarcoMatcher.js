/**
 * Centralized boat-matching logic for Lonja de Isla documents.
 *
 * Document boat names often arrive with a vendiduria prefix
 * (e.g. "CF-JOSE PRIN", "PI-NAVEGA") and may be truncated or have
 * different casing / accents. This module strips prefixes, normalizes
 * text, and performs tiered matching (exact cod → exact name → partial).
 */

import { normalizeText } from '@/helpers/formats/texts';

const DOC_PREFIX_TO_COD_VENDIDURIA = {
  CF: 'CF',
  PI: 'PI',
  EX: 'EX',
  JA: 'JA',
};

const KNOWN_PREFIXES = Object.keys(DOC_PREFIX_TO_COD_VENDIDURIA);
const PREFIX_REGEX = new RegExp(`^(${KNOWN_PREFIXES.join('|')})\\s*[-–—]\\s*`, 'i');

/**
 * Strips a known vendiduria prefix from the raw boat name.
 *
 * @param {string} rawName - Boat name as it appears in the document
 * @returns {{ prefix: string|null, codVendiduria: string|null, name: string }}
 */
export function parseBoatName(rawName) {
  if (!rawName || typeof rawName !== 'string') {
    return { prefix: null, codVendiduria: null, name: rawName || '' };
  }

  const trimmed = rawName.trim();
  const match = trimmed.match(PREFIX_REGEX);

  if (match) {
    const prefix = match[1].toUpperCase();
    return {
      prefix,
      codVendiduria: DOC_PREFIX_TO_COD_VENDIDURIA[prefix] || null,
      name: trimmed.slice(match[0].length).trim(),
    };
  }

  return { prefix: null, codVendiduria: null, name: trimmed };
}

/**
 * Searches the catalog for a boat by cod, then by normalized name,
 * then by partial startsWith.
 */
function findInCatalog(barcosCatalog, venta, cleanName) {
  if (venta.codBarco) {
    const byCod = barcosCatalog.find((b) => b.cod === venta.codBarco);
    if (byCod) return byCod;
  }

  const normalizedName = normalizeText(cleanName);
  if (!normalizedName) return null;

  const byExact = barcosCatalog.find((b) => normalizeText(b.barco) === normalizedName);
  if (byExact) return byExact;

  const byPartial = barcosCatalog.find((b) => {
    const catalogName = normalizeText(b.barco);
    if (!catalogName) return false;
    return catalogName.startsWith(normalizedName) || normalizedName.startsWith(catalogName);
  });
  return byPartial || null;
}

/**
 * Finds the best matching boat from the catalog for a given venta line.
 *
 * Resolution logic:
 *   1. Strip vendiduria prefix from the document boat name (if present).
 *   2. Search the catalog by cod → exact name → partial name.
 *   3. If a catalog match is found AND the document has a prefix whose
 *      codVendiduria differs from the catalog entry, the prefix wins.
 *   4. If NO catalog match is found but there IS a prefix, build a
 *      virtual entry using the document data + prefix vendiduria.
 *   5. If NO match and NO prefix → return null (unresolvable).
 *
 * @param {Array} barcosCatalog - The `barcos` array from exportData
 * @param {Object} venta - A venta row with `codBarco` and `barco` fields
 * @returns {Object|null} A barco-like object with at least
 *   `{ barco, cod, codVendiduria }`, or null when unresolvable.
 */
export function findBarcoMatch(barcosCatalog, venta) {
  if (!venta) return null;

  const {
    prefix,
    codVendiduria: prefixCodVendiduria,
    name: cleanName,
  } = parseBoatName(venta.barco);

  const catalogMatch = findInCatalog(barcosCatalog, venta, cleanName);

  if (catalogMatch) {
    const cod = catalogMatch.cod || venta.codBarco || cleanName;
    const needsOverride = prefixCodVendiduria && prefixCodVendiduria !== catalogMatch.codVendiduria;

    if (needsOverride || !catalogMatch.cod) {
      return {
        ...catalogMatch,
        cod,
        ...(needsOverride && {
          codVendiduria: prefixCodVendiduria,
          _originalCodVendiduria: catalogMatch.codVendiduria,
          _prefixOverride: true,
        }),
      };
    }
    return catalogMatch;
  }

  if (prefixCodVendiduria) {
    return {
      barco: cleanName || venta.barco,
      cod: venta.codBarco || cleanName,
      codVendiduria: prefixCodVendiduria,
      _virtual: true,
    };
  }

  return null;
}
