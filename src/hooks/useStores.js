import { getStores } from "@/services/storeService";
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
