/**
 * Totals Validation Helper
 *
 * Pure function — does not throw. Returns a validation result object
 * so callers can decide whether to block or flag the document for review.
 * Works for both Azure and ChatGPT extraction paths.
 */

const TOLERANCE = 0.02; // 2 cents — covers floating-point rounding

/**
 * Validates that the sum of line item importes matches the declared total.
 *
 * @param {Array} lineItems - Array of line item objects
 * @param {number | null} declaredTotal - Total declared in the document header
 * @param {string} [importeField='importe'] - Field name to sum in each line item
 * @returns {{ valid: boolean, expected: number, actual: number, delta: number } | null}
 *   null if validation cannot be performed (missing data)
 */
export function validateTotals(lineItems, declaredTotal, importeField = 'importe') {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return null;
  if (declaredTotal == null) return null;

  const sum = lineItems.reduce((acc, row) => acc + (Number(row[importeField]) || 0), 0);
  const roundedSum = Number(sum.toFixed(2));
  const delta = Math.abs(roundedSum - Number(declaredTotal));

  return {
    valid: delta <= TOLERANCE,
    expected: Number(declaredTotal),
    actual: roundedSum,
    delta,
  };
}
