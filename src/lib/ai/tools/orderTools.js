/**
 * Tools específicas para Orders (Pedidos)
 * 
 * Estas tools exponen métodos de negocio específicos de pedidos que no son genéricos.
 * Usan directamente orderService para operaciones complejas.
 */

import { orderService } from '@/services/domain/orders/orderService';
import { z } from 'zod';

export const orderTools = {
  /**
   * Obtiene pedidos activos
   */
  getActiveOrders: {
    description: `Obtiene la lista de pedidos activos (pendientes de procesar).

Útil cuando el usuario pregunta:
- "¿Qué pedidos están activos?"
- "Muéstrame los pedidos pendientes"
- "¿Cuántos pedidos hay activos?"`,

    parameters: z.object({}), // ✅ CRÍTICO: parameters debe ser ZodObject directo, NO .optional()

    execute: async () => {
      const orders = await orderService.getActiveOrders();
      return {
        success: true,
        data: Array.isArray(orders) ? orders : (orders?.data || []),
        count: Array.isArray(orders) ? orders.length : (orders?.data?.length || 0),
      };
    },
  },

  /**
   * Obtiene estadísticas de ranking de pedidos
   */
  getOrderRankingStats: {
    description: `Obtiene estadísticas de ranking de pedidos agrupados por diferentes criterios.

Útil para análisis y reportes de rendimiento.`,

    parameters: z.object({
      groupBy: z.string().optional(),
      valueType: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      speciesId: z.number().optional(),
    }),

    execute: async (params) => {
      const stats = await orderService.getRankingStats(params);
      return {
        success: true,
        ...stats,
      };
    },
  },

  /**
   * Obtiene ventas por comercial
   */
  getSalesBySalesperson: {
    description: `Obtiene estadísticas de ventas agrupadas por comercial/vendedor.

Útil para reportes de rendimiento de comerciales.`,

    parameters: z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }),

    execute: async (params) => {
      const stats = await orderService.getSalesBySalesperson(params);
      return {
        success: true,
        ...stats,
      };
    },
  },
};

