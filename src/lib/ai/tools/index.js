/**
 * Registry de todas las tools disponibles para el AI Chat
 * 
 * Este archivo centraliza todas las tools y las expone en un formato
 * que el AI SDK puede consumir.
 */

import { entityTools } from './entityTools';
import { orderTools } from './orderTools';

/**
 * Todas las tools disponibles
 * 
 * Las tools genéricas (entityTools) trabajan con cualquier entidad
 * usando el entityServiceMapper.
 * 
 * Las tools específicas (orderTools, etc.) exponen lógica de negocio
 * compleja que no es genérica.
 */
export const allTools = {
  ...entityTools,
  ...orderTools,
  // Agregar más tools específicas aquí cuando sea necesario
  // Ejemplo: ...storeTools, ...customerTools, etc.
};

/**
 * Obtiene la lista de nombres de tools disponibles
 */
export function getToolNames() {
  return Object.keys(allTools);
}

