// /src/hooks/useOrder.js
import { useState, useEffect } from 'react';
import { getOrder, updateOrder } from '@/services/orderService';
import { useSession } from 'next-auth/react';

export function useOrder(orderId) {
    const { data: session, status } = useSession();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Espera a que la sesión esté lista
        if (!orderId || status === 'loading') return;

        const token = session?.user?.accessToken;
        setLoading(true);
        getOrder(orderId, token)
            .then((data) => setOrder(data))
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [orderId, session, status]);

    // Función para actualizar el pedido a través de la API
    const updateOrderData = async (updateData) => {
        setLoading(true);
        const token = session?.user?.accessToken;
        try {
            const updated = await updateOrder(orderId, updateData, token);
            setOrder(updated);
            return updated;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };
    return { order, loading, error , updateOrderData };
}
