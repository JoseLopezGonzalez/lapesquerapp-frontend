/**
 * Link Service - Servicio para enlace masivo de compras
 * 
 * Maneja el enlace de múltiples compras a recepciones de materia prima
 * Usa el endpoint masivo bulk-update-declared-data para mejor rendimiento
 */

import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from '@/configs/config';

/**
 * Formats error message from error detail object
 * Returns a short message for display and full details for tooltip
 * @param {Object} errorDetail - Error detail from backend
 * @returns {Object} Object with { shortMessage, tooltipText }
 */
function formatErrorDetail(errorDetail) {
    // Use the hint directly if available (backend provides formatted message)
    if (errorDetail.hint) {
        const hint = errorDetail.hint;
        
        // Check if it's about closest reception
        if (hint.includes('Recepción más cercana')) {
            // Extract date
            const dateMatch = hint.match(/(\d{4}-\d{2}-\d{2})/);
            
            if (dateMatch) {
                // Convert date from YYYY-MM-DD to DD/MM/YYYY
                const dateStr = dateMatch[1];
                const [year, month, day] = dateStr.split('-');
                const formattedDate = `${day}/${month}/${year}`;
                
                // Format tooltip with all details
                const tooltipLines = [];
                tooltipLines.push('Recepción más cercana:');
                
                // Extract type (anterior/posterior)
                const typeMatch = hint.match(/\((anterior|posterior)\)/);
                if (typeMatch) {
                    tooltipLines.push(`Tipo: ${typeMatch[1] === 'anterior' ? 'Anterior' : 'Posterior'}`);
                }
                
                // Extract ID
                const idMatch = hint.match(/ID:\s*(\d+)/);
                if (idMatch) {
                    tooltipLines.push(`ID: ${idMatch[1]}`);
                }
                
                // Extract days difference
                const daysMatch = hint.match(/diferencia:\s*(\d+)/);
                if (daysMatch) {
                    const days = daysMatch[1];
                    tooltipLines.push(`Diferencia: ${days} día${days !== '1' ? 's' : ''}`);
                }
                
                return {
                    shortMessage: `Recepción más cercana: ${formattedDate}`,
                    tooltipText: tooltipLines.join('\n')
                };
            }
        }
        
        // Check if no receptions exist
        if (hint.includes('No existen recepciones')) {
            return {
                shortMessage: 'No existen recepciones para este proveedor',
                tooltipText: hint
            };
        }
        
        // Return hint as is if we can't parse it
        return {
            shortMessage: hint,
            tooltipText: hint
        };
    }
    
    // Fallback to message if hint is not available
    const fallbackMessage = errorDetail.message || errorDetail.error || 'Error desconocido';
    return {
        shortMessage: fallbackMessage,
        tooltipText: fallbackMessage
    };
}

/**
 * Groups linked summary items by supplierId and date, combining multiple barcos
 * When multiple barcos have the same supplierId and date, they are combined into one entry
 * 
 * @param {Array} linkedSummaryArray - Array of linked summary objects
 * @returns {Array} Grouped and combined linked summary array
 */
export function groupLinkedSummaryBySupplier(linkedSummaryArray) {
    // Filter out items with errors first
    const validItems = linkedSummaryArray.filter(item => !item.error);
    const errorItems = linkedSummaryArray.filter(item => item.error);

    // Group by supplierId and date
    const grouped = {};
    
    validItems.forEach((item) => {
        const key = `${item.supplierId}_${item.date}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                supplierId: item.supplierId,
                date: item.date,
                declaredTotalNetWeight: 0,
                declaredTotalAmount: 0,
                barcoNombres: [],
                originalItems: [],
                isGrouped: false,
            };
        }
        
        grouped[key].declaredTotalNetWeight += item.declaredTotalNetWeight;
        grouped[key].declaredTotalAmount += item.declaredTotalAmount;
        grouped[key].barcoNombres.push(item.barcoNombre);
        grouped[key].originalItems.push(item);
        
        // Mark as grouped if there are multiple barcos
        if (grouped[key].barcoNombres.length > 1) {
            grouped[key].isGrouped = true;
        }
    });

    // Convert grouped object to array
    const groupedArray = Object.values(grouped).map((group) => {
        const barcoNombre = group.isGrouped 
            ? group.barcoNombres.join(' + ')
            : group.barcoNombres[0];

        return {
            supplierId: group.supplierId,
            date: group.date,
            declaredTotalNetWeight: parseFloat(group.declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(group.declaredTotalAmount.toFixed(2)),
            barcoNombre: barcoNombre,
            error: false,
            isGrouped: group.isGrouped,
            originalItems: group.originalItems, // Keep original items for reference
        };
    });

    // Return grouped items + error items
    return [...groupedArray, ...errorItems];
}

/**
 * Validates purchases before linking them
 * 
 * @param {Array} linkedSummaryArray - Array of linked summary objects
 *   Each object should have: { supplierId, date, declaredTotalNetWeight, declaredTotalAmount, barcoNombre, error }
 * @returns {Promise<Object>} Object with validation results:
 *   - valid: number of valid receptions
 *   - invalid: number of invalid receptions
 *   - readyToUpdate: number of receptions ready to update
 *   - validationResults: array of validation results with barcoNombre and status
 */
export async function validatePurchases(linkedSummaryArray) {
    // Group by supplierId and date first
    const groupedSummary = groupLinkedSummaryBySupplier(linkedSummaryArray);
    
    // Filter only valid items (without error)
    const comprasValidas = groupedSummary.filter(item => !item.error);

    if (comprasValidas.length === 0) {
        return {
            valid: 0,
            invalid: 0,
            readyToUpdate: 0,
            validationResults: []
        };
    }

    try {
        // Prepare request body for validation endpoint
        const receptions = comprasValidas.map((linea) => ({
            supplier_id: linea.supplierId,
            date: linea.date.split('/').reverse().join('-'), // convertir de dd/mm/yyyy a yyyy-mm-dd
            declared_total_net_weight: linea.declaredTotalNetWeight,
            declared_total_amount: linea.declaredTotalAmount,
        }));

        // Make validation request
        const res = await fetchWithTenant(`${API_URL_V2}raw-material-receptions/validate-bulk-update-declared-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receptions }),
        });

        // Handle response (200 for all valid, 207 for partial validation)
        if (!res.ok && res.status !== 207) {
            // Unexpected error
            const errorText = await res.text();
            throw new Error(`Error HTTP ${res.status}: ${errorText}`);
        }

        const responseData = await res.json();

        // Process validation results
        const valid = responseData.valid || 0;
        const invalid = responseData.invalid || 0;
        const readyToUpdate = responseData.ready_to_update || 0;

        // Map validation results to include barcoNombre and status
        const validationResults = [];
        
        // Process valid results
        if (responseData.results && Array.isArray(responseData.results)) {
            responseData.results.forEach((result) => {
                // Find the corresponding linea to get barcoNombre
                const linea = comprasValidas.find(
                    (l) => l.supplierId === result.supplier_id &&
                           l.date.split('/').reverse().join('-') === result.date
                );

                validationResults.push({
                    barcoNombre: linea?.barcoNombre || 'Desconocido',
                    supplierId: result.supplier_id,
                    date: result.date,
                    valid: result.valid,
                    canUpdate: result.can_update,
                    hasChanges: result.has_changes,
                    message: result.message,
                    supplierName: result.supplier_name,
                    isGrouped: linea?.isGrouped || false,
                });
            });
        }

        // Process invalid results (errors)
        if (responseData.errors_details && Array.isArray(responseData.errors_details)) {
            responseData.errors_details.forEach((errorDetail) => {
                // Find the corresponding linea to get barcoNombre
                const linea = comprasValidas.find(
                    (l) => l.supplierId === errorDetail.supplier_id &&
                           l.date.split('/').reverse().join('-') === errorDetail.date
                );

                const errorFormatted = formatErrorDetail(errorDetail);
                validationResults.push({
                    barcoNombre: linea?.barcoNombre || 'Desconocido',
                    supplierId: errorDetail.supplier_id,
                    date: errorDetail.date,
                    valid: false,
                    canUpdate: false,
                    hasChanges: false,
                    message: errorFormatted.shortMessage,
                    tooltip: errorFormatted.tooltipText,
                    error: errorDetail.error,
                    isGrouped: linea?.isGrouped || false,
                });
            });
        }

        return {
            valid,
            invalid,
            readyToUpdate,
            validationResults
        };
    } catch (error) {
        // If validation fails, return all as invalid
        console.error('Error en validación:', error);
        return {
            valid: 0,
            invalid: comprasValidas.length,
            readyToUpdate: 0,
            validationResults: comprasValidas.map((linea) => ({
                barcoNombre: linea.barcoNombre,
                supplierId: linea.supplierId,
                date: linea.date,
                valid: false,
                canUpdate: false,
                hasChanges: false,
                message: error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al validar',
                error: 'Error de validación',
                isGrouped: linea.isGrouped || false,
            }))
        };
    }
}

/**
 * Links all purchases from a linkedSummary array using bulk endpoint
 * 
 * @param {Array} linkedSummaryArray - Array of linked summary objects
 *   Each object should have: { supplierId, date, declaredTotalNetWeight, declaredTotalAmount, barcoNombre, error }
 * @returns {Promise<Object>} Object with statistics:
 *   - correctas: number of successful links
 *   - errores: number of failed links
 *   - erroresDetalles: array of error details with barcoNombre
 */
export async function linkAllPurchases(linkedSummaryArray) {
    // Group by supplierId and date first
    const groupedSummary = groupLinkedSummaryBySupplier(linkedSummaryArray);
    
    // Filter only valid items (without error)
    const comprasValidas = groupedSummary.filter(item => !item.error);

    if (comprasValidas.length === 0) {
        return {
            correctas: 0,
            errores: 0,
            erroresDetalles: []
        };
    }

    try {
        // Prepare request body for bulk endpoint
        const receptions = comprasValidas.map((linea) => ({
            supplier_id: linea.supplierId,
            date: linea.date.split('/').reverse().join('-'), // convertir de dd/mm/yyyy a yyyy-mm-dd
            declared_total_net_weight: linea.declaredTotalNetWeight,
            declared_total_amount: linea.declaredTotalAmount,
        }));

        // Make bulk request
        const res = await fetchWithTenant(`${API_URL_V2}raw-material-receptions/bulk-update-declared-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receptions }),
        });

        // Handle response (200 for all success, 207 for partial success)
        if (!res.ok && res.status !== 207) {
            // Unexpected error (not 200 or 207)
            const errorText = await res.text();
            throw new Error(`Error HTTP ${res.status}: ${errorText}`);
        }

        const responseData = await res.json();

        // Process successful updates
        const correctas = responseData.updated || 0;
        const errores = responseData.errors || 0;

        // Map error details to include barcoNombre
        const erroresDetalles = [];
        if (responseData.errors_details && Array.isArray(responseData.errors_details)) {
            responseData.errors_details.forEach((errorDetail) => {
                // Find the corresponding linea to get barcoNombre
                const linea = comprasValidas.find(
                    (l) => l.supplierId === errorDetail.supplier_id &&
                           l.date.split('/').reverse().join('-') === errorDetail.date
                );

                const errorFormatted = formatErrorDetail(errorDetail);
                erroresDetalles.push({
                    barcoNombre: linea?.barcoNombre || 'Desconocido',
                    error: errorFormatted.shortMessage,
                    tooltip: errorFormatted.tooltipText,
                    supplier_id: errorDetail.supplier_id,
                    date: errorDetail.date,
                });
            });
        }

        return {
            correctas,
            errores,
            erroresDetalles
        };
    } catch (error) {
        // If the entire request fails, return all as errors
        console.error('Error en actualización masiva:', error);
        return {
            correctas: 0,
            errores: comprasValidas.length,
            erroresDetalles: comprasValidas.map((linea) => ({
                barcoNombre: linea.barcoNombre,
                error: error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error al procesar la solicitud masiva'
            }))
        };
    }
}
