// /src/services/supplierLiquidationService.js
import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";
import { getErrorMessage } from "@/lib/api/apiHelpers";

/**
 * Obtiene la lista de proveedores con actividad en un rango de fechas
 * 
 * @async
 * @function getSuppliersWithActivity
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<Array>} Array de proveedores con estadísticas
 */
export const getSuppliersWithActivity = async (startDate, endDate) => {
    const session = await getSession();

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede obtener la lista de proveedores.");
    }

    try {
        const queryParams = new URLSearchParams({
            'dates[start]': startDate,
            'dates[end]': endDate,
        });

        const response = await fetchWithTenant(
            `${API_URL_V2}supplier-liquidations/suppliers?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                },
            }
        );

        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                // Si la respuesta no es JSON, usar el mensaje por defecto
                errorData = { message: `Error ${response.status}: ${response.statusText}` };
            }
            throw new Error(
                getErrorMessage(errorData) || `Error ${response.status}: Error al obtener la lista de proveedores.`
            );
        }

        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error("Error en getSuppliersWithActivity:", error);
        throw error;
    }
};

/**
 * Obtiene el detalle completo de la liquidación de un proveedor
 * 
 * @async
 * @function getSupplierLiquidationDetails
 * @param {number} supplierId - ID del proveedor
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<Object>} Objeto con datos completos de la liquidación
 */
export const getSupplierLiquidationDetails = async (supplierId, startDate, endDate) => {
    const session = await getSession();

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede obtener el detalle de la liquidación.");
    }

    try {
        const queryParams = new URLSearchParams({
            'dates[start]': startDate,
            'dates[end]': endDate,
        });

        const response = await fetchWithTenant(
            `${API_URL_V2}supplier-liquidations/${supplierId}/details?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    Authorization: `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                },
            }
        );

        if (!response.ok) {
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                // Si la respuesta no es JSON, usar el mensaje por defecto
                errorData = { message: `Error ${response.status}: ${response.statusText}` };
            }
            throw new Error(
                getErrorMessage(errorData) || `Error ${response.status}: Error al obtener el detalle de la liquidación.`
            );
        }

        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error("Error en getSupplierLiquidationDetails:", error);
        throw error;
    }
};

/**
 * Descarga el PDF de la liquidación de un proveedor
 * 
 * @async
 * @function downloadSupplierLiquidationPdf
 * @param {number} supplierId - ID del proveedor
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @param {string} supplierName - Nombre del proveedor (para el nombre del archivo)
 * @param {Array<number>} selectedReceptions - IDs de recepciones a incluir (opcional, si está vacío incluye todas)
 * @param {Array<number>} selectedDispatches - IDs de salidas de cebo a incluir (opcional, si está vacío incluye todas)
 * @param {string|null} paymentMethod - Método de pago: 'cash' o 'transfer' (solo si hay IVA en cebo)
 * @param {boolean} hasManagementFee - Indica si lleva gasto de gestión
 * @param {boolean} showTransferPayment - Indica si mostrar el pago por transferencia en el PDF (por defecto true)
 * @throws {Error} Throws an error if there is no authenticated session or if the API request fails.
 * @returns {Promise<boolean>} true si la descarga fue exitosa
 */
export const downloadSupplierLiquidationPdf = async (supplierId, startDate, endDate, supplierName = 'Proveedor', selectedReceptions = [], selectedDispatches = [], paymentMethod = null, hasManagementFee = false, showTransferPayment = true) => {
    const session = await getSession();

    if (!session || !session.user || !session.user.accessToken) {
        throw new Error("No hay sesión autenticada. No se puede descargar el PDF.");
    }

    try {
        const queryParams = new URLSearchParams({
            'dates[start]': startDate,
            'dates[end]': endDate,
        });

        // Agregar recepciones seleccionadas (solo si hay selección)
        if (selectedReceptions && selectedReceptions.length > 0) {
            selectedReceptions.forEach(id => {
                queryParams.append('receptions[]', id);
            });
        }

        // Agregar salidas seleccionadas (solo si hay selección)
        if (selectedDispatches && selectedDispatches.length > 0) {
            selectedDispatches.forEach(id => {
                queryParams.append('dispatches[]', id);
            });
        }

        // Agregar método de pago (solo si hay IVA en cebo)
        if (paymentMethod) {
            queryParams.append('payment_method', paymentMethod);
        }

        // Agregar gasto de gestión (Laravel interpreta "1" como true y "0" como false)
        queryParams.append('has_management_fee', hasManagementFee ? '1' : '0');

        // Agregar mostrar pago por transferencia (solo se envía si es false, por defecto es true)
        if (!showTransferPayment) {
            queryParams.append('show_transfer_payment', '0');
        } else {
            queryParams.append('show_transfer_payment', '1');
        }

        const response = await fetchWithTenant(
            `${API_URL_V2}supplier-liquidations/${supplierId}/pdf?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                },
            }
        );

        if (!response.ok) {
            // Intentar obtener el error como JSON primero
            let errorData = null;
            let errorText = null;
            
            try {
                const responseClone = response.clone();
                errorData = await responseClone.json();
            } catch (jsonError) {
                try {
                    const responseClone = response.clone();
                    errorText = await responseClone.text();
                } catch (textError) {
                    errorText = 'No se pudo leer el contenido del error';
                }
            }

            const detailedError = {
                type: 'HTTP_ERROR',
                status: response.status,
                statusText: response.statusText,
                data: errorData,
                text: errorText,
                message: `Error HTTP ${response.status}: ${response.statusText}`
            };

            console.error("Error durante la descarga del PDF:", detailedError);
            throw detailedError;
        }

        // Obtener el nombre del archivo del header Content-Disposition si está disponible
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `Liquidacion_${supplierName}_${startDate}_${endDate}.pdf`;
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (fileNameMatch && fileNameMatch[1]) {
                fileName = fileNameMatch[1];
            }
        }

        // Descargar el archivo
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        return true;
    } catch (error) {
        console.error("Error en downloadSupplierLiquidationPdf:", error);
        throw error;
    }
};

