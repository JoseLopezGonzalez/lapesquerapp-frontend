/**
 * Transforma las líneas de un producto del historial en datos para gráficas
 * @param {Object} product - Producto con lines
 * @returns {Array} Datos ordenados por fecha para Recharts
 */
export function getChartDataByProduct(product) {
  if (!product?.lines || !Array.isArray(product.lines)) return [];
  return product.lines
    .map((line) => ({
      load_date: line.load_date,
      unit_price: Number(line.unit_price) || 0,
      net_weight: Number(line.net_weight) || 0,
      boxes: Number(line.boxes) || 0,
      amount: Number(line.total) || 0,
    }))
    .sort((a, b) => new Date(a.load_date) - new Date(b.load_date));
}
