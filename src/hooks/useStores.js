import { getStoreOptions, getStores } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";


export function useStores() {
    const { data: session, status } = useSession();

    const token = session?.user?.accessToken;


    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const [isStoreLoading, setIsStoreLoading] = useState(false);

    useEffect(() => {
        if (!token) return;
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
    }, [reload, token]);

    /* const onUpdateCurrentStoreNetWeight = useCallback((storeId, updatedStore) => {
        requestAnimationFrame(() => {
            setStores((prevStores) =>
                prevStores.map((store) =>
                    store.id === storeId ? { ...store, ...updatedStore } : store
                )
            );
        });
    }, []); */

    const onUpdateCurrentStoreTotalNetWeight = useCallback((storeId, totalNetWeight) => {
        requestAnimationFrame(() => {
            setStores((prevStores) =>
                prevStores.map((store) =>
                    store.id == storeId ? { ...store, totalNetWeight } : store
                )
            );
        });
    }, []);

    const onAddNetWeightToStore = useCallback((storeId, netWeight) => {
        // console.log("Adding net weight to store:", storeId, netWeight);
        requestAnimationFrame(() => {
            setStores((prevStores) =>
                prevStores.map((store) =>
                    store.id == storeId ? { ...store, totalNetWeight: store.totalNetWeight + netWeight }
                        : store
                )
            );
        });
    }, []);





    return { stores, loading, error, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, isStoreLoading, setIsStoreLoading};

}



