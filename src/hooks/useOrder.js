// /src/hooks/useOrder.js
import { useState, useEffect } from 'react';
import { getOrder, updateOrder } from '@/services/orderService';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';
import { API_URL_V2 } from '@/configs/config';

export function useOrder(orderId) {
    const { data: session, status } = useSession();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const pallets = order?.pallets || [];

    useEffect(() => {
        // Espera a que la sesión esté lista
        if (!orderId || status === 'loading') return;

        const token = session?.user?.accessToken;
        setLoading(true);
        getOrder(orderId, token)
            .then((data) => setOrder(data))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [orderId]);

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



    return {
        pallets,
        order,
        loading,
        error,
        updateOrderData,
        exportDocument,
    };
}
