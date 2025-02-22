// /src/hooks/useOrder.js
import { useState, useEffect } from 'react';
import { getOrder } from '@/services/orderService';
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

    return { order, loading, error };
}
