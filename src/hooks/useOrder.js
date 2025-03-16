// /src/hooks/useOrder.js
import { useState, useEffect } from 'react';
import { createOrderPlannedProductDetail, deleteOrderPlannedProductDetail, getOrder, updateOrder, updateOrderPlannedProductDetail } from '@/services/orderService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';
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
            existing.quantityDifference = existing.plannedQuantity - existing.productionQuantity;
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

export function useOrder(orderId) {
    const { data: session, status } = useSession();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productOptions, setProductOptions] = useState([]);
    const [taxOptions, setTaxOptions] = useState([]);


    const pallets = order?.pallets || [];

    useEffect(() => {
        // Espera a que la sesión esté lista
        if (!orderId || status === "loading") return; // Espera a que la sesión esté lista


        if (!orderId) return;
        console.log('useOrder', orderId, status);

        const token = session?.user?.accessToken;

        console.log('token', token);
        setLoading(true);
        getOrder(orderId, token)
            .then((data) => {
                setOrder(data);
                setLoading(false);
            }
            )
            .catch((err) => setError(err))
            .finally();

        getProductOptions(token)
            .then((data) => {
                setProductOptions(data.map((product) => ({
                    value: product.id,
                    label: product.name,
                }))
                );
            })
            .catch((err) => setError(err))
            .finally();
        getTaxOptions(token)
            .then((data) => {
                setTaxOptions(data.map((tax) => ({
                    value: tax.id,
                    label: tax.rate,
                }))
                );
            })
            .catch((err) => setError(err))
            .finally();



    }, [orderId, status]);

    const reload = async () => {
        const token = session?.user?.accessToken;
        getOrder(orderId, token)
            .then((data) => {
                setOrder(data);
            }
            )
            .catch((err) => setError(err))
            .finally();

    }

    const mergedProductDetails = mergeOrderDetails(order?.plannedProductDetails, order?.productionProductDetails);

    // Función para actualizar el pedido a través de la API
    const updateOrderData = async (updateData) => {
        /* setLoading(true); */
        const token = session?.user?.accessToken;
        updateOrder(orderId, updateData, token)
            .then((updated) => {
                setOrder(updated);
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
                setOrder(prevOrder => {
                    return {
                        ...prevOrder,
                        plannedProductDetails: prevOrder.plannedProductDetails.map((detail) => {
                            if (detail.id === updated.id) {
                                return updated;
                            } else {
                                return detail;
                            }
                        })
                    }
                })
                reload();
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
                setOrder(prevOrder => {
                    return {
                        ...prevOrder,
                        plannedProductDetails: prevOrder.plannedProductDetails.filter((detail) => detail.id !== id)
                    }
                })
                reload();
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
                setOrder(prevOrder => {
                    return {
                        ...prevOrder,
                        plannedProductDetails: [...prevOrder.plannedProductDetails, created]
                    }
                })
                reload();
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
        const toastId = toast.loading(`Exportando ${documentLabel}.${type}`, darkToastTheme);
        try {
            const response = await fetch(`${API_URL_V2}orders/${order.id}/${type}/${documentName}`, {
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
            console.log(error);
            toast.error('Error al exportar', { id: toastId });
        }
    };

    /*--------------------------*/

    const sendCustomDocuments = async (json) => {

        const token = session?.user?.accessToken;

        return fetch(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
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

        return fetch(`${API_URL_V2}orders/${order.id}/send-standard-documents`, {
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
        standarDocuments: sendStandarDocuments,
    }

    const options = {
        taxOptions,
        productOptions,
    }

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
    };
}
