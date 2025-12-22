import { fetchWithTenant } from "@lib/fetchWithTenant";
// /src/hooks/useOrder.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createOrderIncident, createOrderPlannedProductDetail, deleteOrderPlannedProductDetail, destroyOrderIncident, getOrder, setOrderStatus, updateOrder, updateOrderIncident, updateOrderPlannedProductDetail } from '@/services/orderService';
import { deletePallet, unlinkPalletFromOrder } from '@/services/palletService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { API_URL_V2 } from '@/configs/config';
import { getProductOptions } from '@/services/productService';
import { getTaxOptions } from '@/services/taxService';

const mergeOrderDetails = (plannedProductDetails, productionProductDetails) => {
    const resultMap = new Map();

    // Añadir productos previstos primero
    plannedProductDetails?.forEach(detail => {
        resultMap.set(detail.product.id, {
            product: detail.product,
            plannedQuantity: parseFloat(detail.quantity),
            plannedBoxes: parseFloat(detail.boxes),
            productionQuantity: 0.0,
            productionBoxes: 0.0,
            quantityDifference: parseFloat(detail.quantity) * -1,
            status: 'pending'

        });
    });

    // Añadir datos reales desde pallets
    productionProductDetails?.forEach(production => {
        const existing = resultMap.get(production.product.id);
        if (existing) {
            existing.productionQuantity += parseFloat(production.netWeight);
            existing.productionBoxes += parseFloat(production.boxes);
            existing.quantityDifference = Number(existing.plannedQuantity) - Number(existing.productionQuantity);
            existing.boxesDifference = existing.plannedBoxes - existing.productionBoxes;
            existing.status = existing.quantityDifference == 0
                ? 'success'
                : existing.quantityDifference <= 30 && existing.quantityDifference >= -30 ? 'difference' : 'pending';

        } else {
            resultMap.set(production.product.id, {
                product: production.product,
                plannedQuantity: 0.0,
                plannedBoxes: 0.0,
                productionQuantity: parseFloat(production.netWeight),
                productionBoxes: parseFloat(production.boxes),
                quantityDifference: parseFloat(production.netWeight),
                boxesDifference: parseFloat(production.boxes),
                status: 'noPlanned',
            });
        }
    });

    return Array.from(resultMap.values());
};

export function useOrder(orderId, onChange) {
    const { data: session, status } = useSession();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productOptions, setProductOptions] = useState([]);
    const [taxOptions, setTaxOptions] = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    const pallets = useMemo(() => order?.pallets || [], [order?.pallets]);

    const accessToken = session?.user?.accessToken

    // Cargar opciones de productos e impuestos solo cuando se necesiten (lazy loading)
    const loadOptions = useCallback(async () => {
        if (optionsLoaded || !accessToken) return;
        
        try {
            const [productsData, taxesData] = await Promise.all([
                getProductOptions(accessToken),
                getTaxOptions(accessToken)
            ]);
            
            setProductOptions(productsData.map((product) => ({
                value: product.id,
                label: product.name,
            })));
            
            setTaxOptions(taxesData.map((tax) => ({
                value: tax.id,
                label: tax.rate,
            })));
            
            setOptionsLoaded(true);
        } catch (err) {
            setError(err);
        }
    }, [accessToken, optionsLoaded]);

    useEffect(() => {
        // Espera a que la sesión esté lista
        if (!orderId || status === "loading") return;
        setActiveTab('details');

        if (!orderId) return;

        // Si no hay token, no hacer nada
        if (!accessToken) return;

        setLoading(true);
        getOrder(orderId, accessToken)
            .then((data) => {
                setOrder(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, [orderId, status, accessToken]);

    // Cargar opciones cuando se cambie al tab de productos planificados
    useEffect(() => {
        if (activeTab === 'products' && !optionsLoaded) {
            loadOptions();
        }
    }, [activeTab, optionsLoaded, loadOptions]);

    const reload = useCallback(async () => {
        const token = session?.user?.accessToken;
        if (!token) return;
        
        try {
            const data = await getOrder(orderId, token);
            setOrder(data);
        } catch (err) {
            setError(err);
        }
    }, [orderId, session?.user?.accessToken]);

    // Memoizar mergedProductDetails para evitar recálculos innecesarios
    // Usar las referencias de los arrays directamente - cuando se actualizan, se crean nuevos arrays
    const mergedProductDetails = useMemo(() => {
        if (!order) return [];
        return mergeOrderDetails(order.plannedProductDetails, order.productionProductDetails);
    }, [order?.plannedProductDetails, order?.productionProductDetails]);

    // Función para actualizar el pedido a través de la API
    const updateOrderData = async (updateData) => {
        /* setLoading(true); */
        const token = session?.user?.accessToken;
        updateOrder(orderId, updateData, token)
            .then((updated) => {
                setOrder(updated);
                onChange();
                return updated;
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    };

    const updateOrderStatus = async (status) => {
        const token = session?.user?.accessToken;
        setOrderStatus(orderId, status, token)
            .then((updated) => {
                setOrder(updated);
                onChange();
                return updated;
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    };

    /* plannedProductDetail */

    const updatePlannedProductDetail = async (id, updateData) => {
        const token = session?.user?.accessToken;
        updateOrderPlannedProductDetail(id, updateData, token)
            .then((updated) => {
                // Actualizar estado local creando un nuevo objeto para forzar re-render
                setOrder(prevOrder => {
                    if (!prevOrder) return prevOrder;
                    const updatedPlannedDetails = prevOrder.plannedProductDetails.map((detail) => {
                        if (detail.id === updated.id) {
                            return updated;
                        } else {
                            return detail;
                        }
                    });
                    // Crear un nuevo objeto order para forzar la actualización
                    return {
                        ...prevOrder,
                        plannedProductDetails: updatedPlannedDetails
                    };
                });
                onChange?.();
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    };

    const deletePlannedProductDetail = async (id) => {
        const token = session?.user?.accessToken;
        deleteOrderPlannedProductDetail(id, token)
            .then(() => {
                // Actualizar estado local creando un nuevo objeto para forzar re-render
                setOrder(prevOrder => {
                    if (!prevOrder) return prevOrder;
                    return {
                        ...prevOrder,
                        plannedProductDetails: prevOrder.plannedProductDetails.filter((detail) => detail.id !== id)
                    };
                });
                onChange?.();
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    }

    const createPlannedProductDetail = async (detailData) => {
        const token = session?.user?.accessToken;
        createOrderPlannedProductDetail(detailData, token)
            .then((created) => {
                // Actualizar estado local creando un nuevo objeto para forzar re-render
                setOrder(prevOrder => {
                    if (!prevOrder) return prevOrder;
                    return {
                        ...prevOrder,
                        plannedProductDetails: [...prevOrder.plannedProductDetails, created]
                    };
                });
                onChange?.();
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    }

    const plannedProductDetailActions = {
        update: updatePlannedProductDetail,
        delete: deletePlannedProductDetail,
        create: createPlannedProductDetail,
    }

    const plannedProductDetails = order?.plannedProductDetails || [];


    /* ---------------------- */

    const exportDocument = async (documentName, type, documentLabel) => {
        const toastId = toast.loading(`Exportando ${documentLabel}.${type}`, getToastTheme());
        try {
            const response = await fetchWithTenant(`${API_URL_V2}orders/${order.id}/${type}/${documentName}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                }
            });

            if (!response.ok) {
                throw new Error('Error al exportar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${documentLabel}_${order.id}.${type}`; // Nombre del archivo de descarga
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Liberar memoria

            toast.success('Exportación exitosa', { id: toastId });

        } catch (error) {
            // console.log(error);
            toast.error('Error al exportar', { id: toastId });
        }
    };

    /*--------------------------*/

    const sendCustomDocuments = async (json) => {

        const token = session?.user?.accessToken;

        return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',  // <- Este es el header que necesitas
                'Authorization': `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
            body: JSON.stringify(json),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Error ');
                    });
                }
                return response.json();
            })
            .catch((error) => {
                throw error;
            })
    };

    const sendStandarDocuments = async () => {
        const token = session?.user?.accessToken;

        return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-standard-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',  // <- Este es el header que necesitas
                'Authorization': `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Error ');
                    });
                }
                return response.json();
            })
            .then((data) => {
                return data.data;
            })
            .catch((error) => {
                throw error;
            })
    };

    const sendDocuments = {
        customDocuments: sendCustomDocuments,
        standardDocuments: sendStandarDocuments,
    }

    const options = {
        taxOptions,
        productOptions,
    }

    const exportDocuments = [
        {
            name: 'loading-note',
            label: 'Nota de Carga',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
        },
        {
            name: 'restricted-loading-note',
            label: 'Nota de Carga (Restringida)',
            types: ['pdf'],
            fields: ['Datos básicos - sin nombre de cliente', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
        },
        {
            name: 'traceability-document',
            label: 'Documento de trazabilidad',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Historial'],
        },
        {
            name: 'order-cmr',
            label: 'Documento de transporte (CMR)',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
        },
        {
            name: 'order-confirmation-document',
            label: 'Documento confirmación de pedido',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Precios'],
        },
        {
            name: 'order-signs',
            label: 'Letreros de transporte',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
        },
        {
            name: 'order-packing-list',
            label: 'Packing List',
            types: ['pdf', 'xls'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
        },
        {
            name: 'order-sheet',
            label: 'Hoja de pedido',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Productos'],
        },
        {
            name: 'article-report',
            label: 'Reporte de Artículos',
            types: ['xlsx'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
        },
        {
            name: 'pallet-report',
            label: 'Reporte de Palets',
            types: ['xlsx'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
        },
        {
            name: 'lots-report',
            label: 'Reporte de Lotes',
            types: ['xlsx'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
        },
        {
            name: 'boxes-report',
            label: 'Reporte de Cajas',
            types: ['xlsx'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Cajas', 'Productos'],
        },
        {
            name: 'logs-differences-report',
            label: 'Reporte Logs de diferencias',
            types: ['xlsx'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Historial', 'Productos'],
        },
        {
            name: 'A3ERP-sales-delivery-note',
            label: 'Albarán de venta A3ERP',
            types: ['xls'],
            fields: ['Datos básicos', 'Direcciones', 'A3ERP', 'Productos'],
        },
        {
            name: 'valued-loading-note',
            label: 'Nota de carga valorada',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
        },
        {
            name: 'order-confirmation',
            label: 'Confirmación de pedido',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
        },
        {
            name: 'transport-pickup-request',
            label: 'Solicitud de recogida de transporte',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
        },
        /* incident */
        {
            name: 'incident',
            label: 'Reporte de Incidencias',
            types: ['pdf'],
            fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Incidencias'],
        },
        

    ];


    const fastExportDocuments = [
        {
            name: 'order-sheet',
            label: 'Hoja de pedido',
            type: 'pdf',
        },
        {
            name: 'loading-note',
            label: 'Nota de carga',
            type: 'pdf',
        },
        {
            name: 'restricted-loading-note',
            label: 'Nota de carga (Restringida)',
            type: 'pdf',
        },
        {
            name: 'order-cmr',
            label: 'Documento de transporte (CMR)',
            type: 'pdf',
        },
        {
            name: 'order-signs',
            label: 'Letreros de transporte',
            type: 'pdf',
        },
        {
            name: 'order-packing-list',
            label: 'Packing List',
            type: 'pdf',
        },
    ];


    const updateTemperatureOrder = async (updatedTemperature) => {
        const token = session?.user?.accessToken;
        updateOrder(orderId, { temperature: updatedTemperature }, token)
            .then((updated) => {
                setOrder(updated);
                onChange();
                return updated;
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    }

    const openOrderIncident = async (description) => {
        const token = session?.user?.accessToken;
        createOrderIncident(order.id, description, token)
            .then((updated) => {
                setOrder(prevOrder => {
                    return {
                        ...prevOrder,
                        status: 'incident',
                        incident: updated
                    }
                });
                onChange();
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    }

    const resolveOrderIncident = async (resolutionType, resolutionNotes) => {
        const token = session?.user?.accessToken;

        return updateOrderIncident(order.id, resolutionType, resolutionNotes, token)
            .then((updatedIncident) => {
                setOrder((prev) => ({
                    ...prev,
                    incident: updatedIncident,
                }));
                onChange?.();
                return updatedIncident;
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    };

    /* delete orderIncident */
    const deleteOrderIncident = async () => {
        const token = session?.user?.accessToken;

        return destroyOrderIncident(order.id, token)
            .then(() => {
                setOrder((prev) => ({
                    ...prev,
                    status: 'finished',
                    incident: null,
                }));
                onChange?.();
            })
            .catch((err) => {
                setError(err);
                throw err;
            });
    }

    const onEditingPallet = (updatedPallet) => {
        const isPalletVinculated = updatedPallet.orderId === order.id;
        if (!isPalletVinculated) {
            toast.error('El pallet no está vinculado a este pedido');
            return;
        } 
        // Actualizar pallets localmente primero para respuesta inmediata
        setOrder(prevOrder => {
            if (!prevOrder) return prevOrder;
            return {
                ...prevOrder,
                pallets: prevOrder.pallets.map(pallet => pallet.id == updatedPallet.id ? updatedPallet : pallet)
            };
        });
        // Recargar para obtener productionProductDetails actualizado desde el servidor
        reload().then(() => {
            onChange?.();
        });
    }

    const onCreatingPallet = (newPallet) => {
        const isPalletVinculated = newPallet.orderId === order.id;
        if (!isPalletVinculated) {
            toast.error('El pallet no está vinculado a este pedido');
            return;
        }
        // Actualizar pallets localmente primero para respuesta inmediata
        setOrder(prevOrder => {
            if (!prevOrder) return prevOrder;
            return {
                ...prevOrder,
                pallets: [...prevOrder.pallets, newPallet]
            };
        });
        // Recargar para obtener productionProductDetails actualizado desde el servidor
        reload().then(() => {
            onChange?.();
        });
    }

    const onDeletePallet = async (palletId) => {
        const token = session?.user?.accessToken;
        try {
            await deletePallet(palletId, token);
            // Actualizar pallets localmente primero para respuesta inmediata
            setOrder(prevOrder => ({
                ...prevOrder,
                pallets: prevOrder.pallets.filter(pallet => pallet.id !== palletId)
            }));
            // Recargar para obtener productionProductDetails actualizado desde el servidor
            await reload();
            onChange?.();
            toast.success('Palet eliminado correctamente');
        } catch (error) {
            toast.error(error.message || 'Error al eliminar el palet');
            throw error;
        }
    };

    const onUnlinkPallet = async (palletId) => {
        const token = session?.user?.accessToken;
        try {
            await unlinkPalletFromOrder(palletId, token);
            // Actualizar pallets localmente primero para respuesta inmediata
            setOrder(prevOrder => ({
                ...prevOrder,
                pallets: prevOrder.pallets.filter(pallet => pallet.id !== palletId)
            }));
            // Recargar para obtener productionProductDetails actualizado desde el servidor
            await reload();
            onChange?.();
            toast.success('Palet desvinculado correctamente');
        } catch (error) {
            toast.error(error.message || 'Error al desvincular el palet');
            throw error;
        }
    };



    return {
        pallets,
        order,
        loading,
        error,
        updateOrderData,
        exportDocument,
        mergedProductDetails,
        options,
        plannedProductDetailActions,
        plannedProductDetails,
        sendDocuments,
        updateOrderStatus,
        exportDocuments,
        fastExportDocuments,
        activeTab,
        setActiveTab,
        updateTemperatureOrder,
        openOrderIncident,
        resolveOrderIncident,
        deleteOrderIncident,
        onEditingPallet,
        onCreatingPallet,
        onDeletePallet,
        onUnlinkPallet
    };
}
