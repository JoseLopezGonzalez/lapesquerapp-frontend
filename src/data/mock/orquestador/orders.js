/**
 * Mock pedidos activos para la vista Orquestador (maqueta).
 * Incluye progreso por producto (planificado vs completado) y estados de línea.
 * loadDate en ISO; status: pending | finished | incident.
 * productProgress: status de línea = 'pending' | 'completed' | 'exceeded'.
 */

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

function toISO(date) {
  return date.toISOString().slice(0, 10) + 'T08:00:00.000Z';
}

export const MOCK_ORDERS_INITIAL = [
  {
    id: 12345,
    customer: { id: 101, name: 'Pescados del Norte S.L.' },
    status: 'pending',
    loadDate: toISO(today),
    temperature: 4,
    transport: { name: 'Olano' },
    productProgress: [
      {
        product: { id: 501, name: 'Atún fresco' },
        plannedQuantity: 150.5,
        plannedBoxes: 25,
        completedQuantity: 120.0,
        completedBoxes: 12,
        remainingQuantity: 30.5,
        remainingBoxes: 13,
        status: 'pending',
      },
      {
        product: { id: 502, name: 'Salmón entero' },
        plannedQuantity: 200.0,
        plannedBoxes: 40,
        completedQuantity: 402.0,
        completedBoxes: 20,
        remainingQuantity: -202.0,
        remainingBoxes: -20,
        status: 'exceeded',
      },
      {
        product: { id: 503, name: 'Merluza' },
        plannedQuantity: 180.25,
        plannedBoxes: 30,
        completedQuantity: 0,
        completedBoxes: 0,
        remainingQuantity: 180.25,
        remainingBoxes: 30,
        status: 'pending',
      },
    ],
    palletIds: [9001, 9002],
  },
  {
    id: 12346,
    customer: { id: 102, name: 'Mariscos Premium' },
    status: 'pending',
    loadDate: toISO(tomorrow),
    temperature: -18,
    transport: { name: 'TIR' },
    productProgress: [
      {
        product: { id: 501, name: 'Atún fresco' },
        plannedQuantity: 120.0,
        plannedBoxes: 20,
        completedQuantity: 45.0,
        completedBoxes: 8,
        remainingQuantity: 75.0,
        remainingBoxes: 12,
        status: 'pending',
      },
      {
        product: { id: 504, name: 'Gambas congeladas' },
        plannedQuantity: 100.0,
        plannedBoxes: 20,
        completedQuantity: 310.2,
        completedBoxes: 10,
        remainingQuantity: -210.2,
        remainingBoxes: -10,
        status: 'exceeded',
      },
      {
        product: { id: 505, name: 'Langostinos' },
        plannedQuantity: 75.5,
        plannedBoxes: 15,
        completedQuantity: 0,
        completedBoxes: 0,
        remainingQuantity: 75.5,
        remainingBoxes: 15,
        status: 'pending',
      },
    ],
    palletIds: [9003],
  },
  {
    id: 12347,
    customer: { id: 103, name: 'Distribuidora Costera' },
    status: 'pending',
    loadDate: toISO(today),
    temperature: 0,
    transport: { name: 'TPO' },
    productProgress: [
      {
        product: { id: 502, name: 'Salmón entero' },
        plannedQuantity: 150.0,
        plannedBoxes: 30,
        completedQuantity: 0,
        completedBoxes: 0,
        remainingQuantity: 150.0,
        remainingBoxes: 30,
        status: 'pending',
      },
      {
        product: { id: 506, name: 'Bacalao salado' },
        plannedQuantity: 300.0,
        plannedBoxes: 50,
        completedQuantity: 0,
        completedBoxes: 0,
        remainingQuantity: 300.0,
        remainingBoxes: 50,
        status: 'pending',
      },
      {
        product: { id: 507, name: 'Bonito del Norte' },
        plannedQuantity: 120.75,
        plannedBoxes: 24,
        completedQuantity: 0,
        completedBoxes: 0,
        remainingQuantity: 120.75,
        remainingBoxes: 24,
        status: 'pending',
      },
    ],
    palletIds: [],
  },
  {
    id: 12348,
    customer: { id: 104, name: 'Restaurante El Puerto' },
    status: 'finished',
    loadDate: toISO(today),
    temperature: 4,
    transport: { name: 'Distran' },
    productProgress: [
      {
        product: { id: 501, name: 'Atún fresco' },
        plannedQuantity: 80.0,
        plannedBoxes: 15,
        completedQuantity: 80.0,
        completedBoxes: 15,
        remainingQuantity: 0,
        remainingBoxes: 0,
        status: 'completed',
      },
      {
        product: { id: 509, name: 'Lubina' },
        plannedQuantity: 45.0,
        plannedBoxes: 9,
        completedQuantity: 45.0,
        completedBoxes: 9,
        remainingQuantity: 0,
        remainingBoxes: 0,
        status: 'completed',
      },
    ],
    palletIds: [],
  },
];

export { toISO };
