export function roundToTwoDecimals(weight: unknown): number {
  const num = parseFloat(String(weight));
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(2));
}
