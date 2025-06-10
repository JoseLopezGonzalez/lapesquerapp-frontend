import { getStoreOptions } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const useStoresOptions = () => {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [storeOptions, setStoreOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getStoreOptions(token)
            .then((store) => {
                setStoreOptions(store.map(s => ({ value: `${s.id}`, label: `${s.name}` })));
            })
            .catch(err => console.error('Error al cargar impuestos:', err))
            .finally(() => setLoading(false));
    }, [token]);

    return { storeOptions, loading };
};