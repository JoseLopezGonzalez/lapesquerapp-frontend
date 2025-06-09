import { getStoreOptions, getStores } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";


export function useStores() {
    const { data: session, status } = useSession();

    const token = session?.user?.accessToken;


    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        if(!token) return;
        getStores(token)
            .then((data) => {
                setStores(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error al obtener los almacenes', error);
                setError(error);
                setLoading(false);
            });
    }, [reload , token]);

    return { stores, loading, error };

}

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

