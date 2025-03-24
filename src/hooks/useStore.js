import { getStore, getStores } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";


export function useStore(storeId) {
    const { data: session, status } = useSession();

    const token = session?.user?.accessToken;


    const [store, setStore] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        setLoading(true);
        if(!token) return;
        getStore(storeId ,token)
            .then((data) => {
                setStore(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error al obtener los almacenes', error);
                setError(error);
                setLoading(false);
            });
    }, [reload , token , storeId]);

    return { store, loading, error };

}
