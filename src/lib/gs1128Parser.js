/**
 * Parseo y normalización de códigos GS1-128 para cajas (01 + peso 3102/3202 + 10 lote).
 * Formato esperado: 01(GTIN 14 dígitos) + 3102(peso kg, 6 dígitos centésimas) + 10(lote)
 * o 3202(peso en libras, 6 dígitos centésimas) + 10(lote). Libras se convierten a kg (0.453592).
 * AI 3102/3202 = 2 decimales según el estándar GS1 (ver GAP-V2-078). Se sigue aceptando en
 * lectura el AI legacy 3100/3200 (0 decimales según GS1, pero codificado por este mismo
 * sistema antes del fix con 2 decimales implícitos) para no romper códigos ya impresos en
 * cajas activas — decodifica igual (/100) porque el empaquetado numérico nunca cambió, solo
 * el AI declarado.
 * Unificado para Autoventa (Step2QRScan) y editor de palets (usePallet).
 */

function roundToTwoDecimals(weight) {
  const num = parseFloat(weight);
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(2));
}

// El AI GS1 01 siempre trae 14 dígitos, pero boxGtin se guarda tal cual lo introdujo el
// usuario (8-14 dígitos, ver validación de producto) sin rellenar con ceros. Hay que
// normalizar el GTIN almacenado al mismo formato de 14 dígitos antes de comparar con el
// GTIN de 14 dígitos que sale del código escaneado/pegado.
function normalizeGtinTo14(value) {
  return String(value ?? '').padStart(14, '0');
}

/**
 * Normaliza un código escaneado a formato GS1-128 estándar (01)(3102|3202)(10).
 * @param {string} scannedCode - Código crudo (con o sin paréntesis)
 * @returns {string|null} Forma normalizada o null si no coincide
 */
export function normalizeScannedCodeToGs1128(scannedCode) {
  let match = scannedCode.match(/01(\d{14})(?:3102|3100)(\d{6})10(.+)/);
  if (match) {
    const [, gtin, weightStr, lot] = match;
    return `(01)${gtin}(3102)${weightStr}(10)${lot}`;
  }
  match = scannedCode.match(/01(\d{14})(?:3202|3200)(\d{6})10(.+)/);
  if (match) {
    const [, gtin, weightStr, lot] = match;
    return `(01)${gtin}(3202)${weightStr}(10)${lot}`;
  }
  return null;
}

/**
 * Parsea una línea GS1-128 y devuelve un objeto canónico o null.
 * productsOptions: array de { value, label, boxGtin }.
 * @param {string} line - Línea cruda (se hace trim)
 * @param {Array<{ value, label, boxGtin }>} productsOptions - Opciones de productos con boxGtin
 * @returns {{
 *   productId,
 *   productName,
 *   lot,
 *   netWeight,
 *   gs1128,
 *   isPounds,
 *   originalWeightInPounds?
 * }|null}
 */
export function parseGs1128Line(line, productsOptions) {
  const scannedCode = String(line).trim();
  let match = scannedCode.match(/01(\d{14})(?:3102|3100)(\d{6})10(.+)/);
  let isPounds = false;
  if (!match) {
    match = scannedCode.match(/01(\d{14})(?:3202|3200)(\d{6})10(.+)/);
    isPounds = true;
  }
  if (!match) return null;
  const [, gtin, weightStr, lotFromCode] = match;
  let netWeight = parseFloat(weightStr) / 100;
  if (isPounds) netWeight = netWeight * 0.453592;
  netWeight = roundToTwoDecimals(netWeight);
  // p.boxGtin es opcional: un producto sin GTIN de caja configurado no debe poder
  // "coincidir" con un código real solo porque ambos se normalizarían al mismo
  // relleno de ceros — eso emparejaría por error dos productos distintos que
  // simplemente no tienen GTIN.
  const product = productsOptions.find((p) => p.boxGtin && normalizeGtinTo14(p.boxGtin) === gtin);
  if (!product) return null;
  const gs1128 = normalizeScannedCodeToGs1128(scannedCode) || scannedCode;
  const result = {
    productId: product.value,
    productName: product.label,
    lot: lotFromCode,
    netWeight,
    gs1128,
    isPounds,
  };
  if (isPounds) {
    result.originalWeightInPounds = parseFloat(weightStr) / 100;
  }
  return result;
}
