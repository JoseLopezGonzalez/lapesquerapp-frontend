import { getStoreOptions, getStores, getRegisteredPallets } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

// ID especial para el almacén fantasma
export const REGISTERED_PALLETS_STORE_ID = "registered";

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
        
        // Obtener almacenes y palets registrados en paralelo
        Promise.all([
            getStores(token),
            getRegisteredPallets(token).catch((error) => {
                // Si falla obtener palets registrados, crear un almacén fantasma vacío
                console.warn('Error al obtener palets registrados:', error);
                return {
                    id: null,
                    name: "En espera",
                    temperature: null,
                    capacity: null,
                    netWeightPallets: 0,
                    totalNetWeight: 0,
                    content: {
                        pallets: [],
                        boxes: [],
                        bigBoxes: []
                    },
                    map: null
                };
            })
        ])
            .then(([storesData, registeredPalletsData]) => {
                let allStores = [...(storesData || [])];
                
                // Siempre agregar el almacén fantasma, incluso si está vacío
                // Asegurar que el almacén fantasma tenga un ID especial para identificarlo
                const ghostStore = {
                    ...registeredPalletsData,
                    id: REGISTERED_PALLETS_STORE_ID,
                    name: registeredPalletsData?.name || "En espera",
                    // Si capacity es null, usar un valor por defecto para evitar divisiones por cero
                    capacity: registeredPalletsData?.capacity || registeredPalletsData?.totalNetWeight || registeredPalletsData?.netWeightPallets || 1,
                    // Asegurar que totalNetWeight tenga un valor
                    totalNetWeight: registeredPalletsData?.totalNetWeight || registeredPalletsData?.netWeightPallets || 0,
                    temperature: registeredPalletsData?.temperature ?? null,
                    content: registeredPalletsData?.content || {
                        pallets: [],
                        boxes: [],
                        bigBoxes: []
                    },
                    map: registeredPalletsData?.map ?? null
                };
                
                // Agregar el almacén fantasma al principio
                allStores = [ghostStore, ...allStores];
                
                console.log('Stores loaded:', allStores.length, 'stores including ghost store');
                console.log('Ghost store data:', ghostStore);
                console.log('All stores IDs:', allStores.map(s => ({ id: s.id, name: s.name })));
                setStores(allStores);
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
                    store.id == storeId ? { ...store, totalNetWeight: (store.totalNetWeight || 0) + netWeight }
                        : store
                )
            );
        });
    }, []);





    return { stores, loading, error, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, isStoreLoading, setIsStoreLoading};

}



