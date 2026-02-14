export function roundToTwoDecimals(weight) {
  const num = parseFloat(weight);
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(2));
}
