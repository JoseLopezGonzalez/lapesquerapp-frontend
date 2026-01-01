/**
 * Link Service - Servicio para enlace masivo de compras
 * 
 * Maneja el enlace de múltiples compras a recepciones de materia prima
 */

import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V1 } from '@/configs/config';

/**
 * Links all purchases from a linkedSummary array
 * 
 * @param {Array} linkedSummaryArray - Array of linked summary objects
 *   Each object should have: { supplierId, date, declaredTotalNetWeight, declaredTotalAmount, barcoNombre, error }
 * @returns {Promise<Object>} Object with statistics:
 *   - correctas: number of successful links
 *   - errores: number of failed links
 *   - erroresDetalles: array of error details
 */
export async function linkAllPurchases(linkedSummaryArray) {
    // Filter only valid items (without error)
    const comprasValidas = linkedSummaryArray.filter(item => !item.error);

    if (comprasValidas.length === 0) {
        return {
            correctas: 0,
            errores: 0,
            erroresDetalles: []
        };
    }

    let correctas = 0;
    let errores = 0;
    const erroresDetalles = [];

    // Process all links in parallel
    const results = await Promise.allSettled(
        comprasValidas.map(async (linea) => {
            try {
                const res = await fetchWithTenant(`${API_URL_V1}raw-material-receptions/update-declared-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplier_id: linea.supplierId,
                        date: linea.date.split('/').reverse().join('-'), // convertir de dd/mm/yyyy a yyyy-mm-dd
                        declared_total_net_weight: linea.declaredTotalNetWeight,
                        declared_total_amount: linea.declaredTotalAmount,
                    }),
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                return { success: true, linea };
            } catch (error) {
                return { 
                    success: false, 
                    linea, 
                    error: error.message || 'Error desconocido' 
                };
            }
        })
    );

    // Process results
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            if (result.value.success) {
                correctas++;
            } else {
                errores++;
                erroresDetalles.push({
                    barcoNombre: result.value.linea.barcoNombre,
                    error: result.value.error
                });
            }
        } else {
            errores++;
            erroresDetalles.push({
                error: result.reason?.message || 'Error desconocido'
            });
        }
    });

    return {
        correctas,
        errores,
        erroresDetalles
    };
}

