/**
 * Mock data para la vista Orquestador (maqueta funcional).
 * No conecta con backend. Uso: clonar estos datos en estado del componente
 * y simular guardar/imprimir/finalizar actualizando ese estado.
 */

import { MOCK_PRODUCTS } from './products';
import { MOCK_ORDERS_INITIAL } from './orders';
import { MOCK_PALLETS_INITIAL } from './pallets';
import { toISO } from './orders';

export { MOCK_PRODUCTS } from './products';
export { MOCK_ORDERS_INITIAL, toISO } from './orders';
export { MOCK_PALLETS_INITIAL } from './pallets';

/**
 * Cajas disponibles: nacen en Pantalla 1 (emisión de etiquetas) y se consumen en Pantalla 2 (escaneo → palet).
 * status: 'available' = pendiente de escaneo; al escanear pasan al palet en construcción.
 */
function seedAvailableBoxes(products) {
  return [
    { id: 10001, productId: 501, productName: 'Atún fresco', lot: 'LOT-2025-001', netWeight: 20.5, status: 'available' },
    { id: 10002, productId: 501, productName: 'Atún fresco', lot: 'LOT-2025-001', netWeight: 19.8, status: 'available' },
    { id: 10003, productId: 501, productName: 'Atún fresco', lot: 'LOT-2025-001', netWeight: 21.2, status: 'available' },
    { id: 10004, productId: 502, productName: 'Salmón entero', lot: 'LOT-2025-002', netWeight: 18.0, status: 'available' },
    { id: 10005, productId: 502, productName: 'Salmón entero', lot: 'LOT-2025-002', netWeight: 20.1, status: 'available' },
    { id: 10006, productId: 503, productName: 'Merluza', lot: 'LOT-2025-003', netWeight: 15.5, status: 'available' },
  ];
}

/**
 * Devuelve una copia profunda del estado inicial para la maqueta.
 * Fija loadDate de los pedidos a hoy/mañana real. Incluye cajas disponibles (semilla) para Pantalla 2.
 */
export function getInitialMockState() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const ordersRaw = JSON.parse(JSON.stringify(MOCK_ORDERS_INITIAL));
  const orderDates = [today, tomorrow, today, today];
  const orders = ordersRaw.map((o, i) => ({
    ...o,
    loadDate: toISO(orderDates[i % orderDates.length]),
  }));
  const products = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
  return {
    products,
    orders,
    pallets: JSON.parse(JSON.stringify(MOCK_PALLETS_INITIAL)),
    availableBoxes: seedAvailableBoxes(products),
    nextBoxId: 10007,
  };
}
