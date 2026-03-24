'use client';

import { useCustomerOrderHistoryRanges } from './useCustomerOrderHistoryRanges';

/**
 * Hook para cargar y gestionar el historial de pedidos del cliente
 * @param {Object} order - Pedido actual (de OrderContext)
 * @returns {Object} Estado y funciones para el historial de cliente
 */
export function useCustomerHistory(order) {
    const customerId = order?.customer?.id;
    return useCustomerOrderHistoryRanges({
        customerId,
        enabled: true,
        notifyOnError: true,
    });
}
