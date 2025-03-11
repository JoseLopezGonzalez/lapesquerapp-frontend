// /src/hooks/useOrder.js
import { useState, useEffect } from 'react';
import { createOrderPlannedProductDetail, deleteOrderPlannedProductDetail, getOrder, updateOrder, updateOrderPlannedProductDetail } from '@/services/orderService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';
import { API_URL_V2 } from '@/configs/config';
import { getProductOptions } from '@/services/productService';
import { getTaxOptions } from '@/services/taxService';

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


    const mergeOrderDetails = (plannedProductDetails, realDetails) => {
        const resultMap = new Map();

        // Añadir productos previstos primero
        plannedProductDetails?.forEach(detail => {
            resultMap.set(detail.product_id, {
                product_id: detail.product_id,
                product_name: detail.product_name,
                quantityPlanned: parseFloat(detail.quantity),
                boxesPlanned: parseFloat(detail.boxes),
                palletsPlanned: parseFloat(detail.pallets),
                unit_price: detail.unit_price,
                line_base: detail.line_base,
                line_total: detail.line_total,
                tax_id: detail.tax_id,
                quantityReal: 0.0,
                boxesReal: 0.0,

            });
        });

        // Añadir datos reales desde pallets
        realDetails?.forEach(real => {
            const existing = resultMap.get(real.product.id);
            if (existing) {
                existing.quantityReal += parseFloat(real.netWeight);
                existing.boxesReal += parseFloat(real.boxes);
            } else {
                resultMap.set(real.product.id, {
                    product_name: real.product_name,
                    quantityPlanned: 0,
                    boxesPlanned: 0,
                    product_id: real.product.id,
                    quantity: 0,
                    boxes: 0,
                    quantityReal: real.netWeight,
                    boxesReal: real.boxes,
                    productExtra: true, // Marca para identificar que es producto no previsto inicialmente
                });
            }
        });

        return Array.from(resultMap.values());
    };

    const mergedDetails = mergeOrderDetails(order?.plannedProductDetails, order?.realDetails);

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
        mergedDetails,
        options,
        plannedProductDetailActions,
        plannedProductDetails,
    };
}
