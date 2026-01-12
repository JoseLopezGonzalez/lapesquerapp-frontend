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
    const [pagination, setPagination] = useState({ links: null, meta: null });
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!token) return;
        
        // Obtener almacenes y palets registrados en paralelo
        Promise.all([
            getStores(token, 1),
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
            .then(([storesResponse, registeredPalletsData]) => {
                // storesResponse ahora tiene { data, links, meta }
                const storesData = storesResponse.data || storesResponse || [];
                
                let allStores = [...(storesData || [])];
                
                // Guardar información de paginación
                setPagination({
                    links: storesResponse.links || null,
                    meta: storesResponse.meta || null
                });
                
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

    const loadMoreStores = useCallback(async () => {
        if (!token || loadingMore || !pagination.links?.next) return;
        
        setLoadingMore(true);
        try {
            // Extraer el número de página de la URL next
            const nextUrl = pagination.links.next;
            const pageMatch = nextUrl.match(/[?&]page=(\d+)/);
            const nextPage = pageMatch ? parseInt(pageMatch[1]) : (pagination.meta?.current_page || 1) + 1;
            
            const storesResponse = await getStores(token, nextPage);
            const newStores = storesResponse.data || [];
            
            // Acumular los nuevos stores sin borrar los anteriores
            setStores((prevStores) => {
                // Filtrar el ghost store temporalmente
                const ghostStore = prevStores.find(s => s.id === REGISTERED_PALLETS_STORE_ID);
                const existingStores = prevStores.filter(s => s.id !== REGISTERED_PALLETS_STORE_ID);
                
                // Combinar stores existentes con los nuevos (evitando duplicados)
                const existingIds = new Set(existingStores.map(s => s.id));
                const uniqueNewStores = newStores.filter(s => !existingIds.has(s.id));
                
                // Reconstruir el array con ghost store al principio
                return ghostStore ? [ghostStore, ...existingStores, ...uniqueNewStores] : [...existingStores, ...uniqueNewStores];
            });
            
            // Actualizar información de paginación
            setPagination({
                links: storesResponse.links || null,
                meta: storesResponse.meta || null
            });
        } catch (error) {
            console.error('Error al cargar más almacenes', error);
        } finally {
            setLoadingMore(false);
        }
    }, [token, loadingMore, pagination]);

    return { 
        stores, 
        loading, 
        error, 
        onUpdateCurrentStoreTotalNetWeight, 
        onAddNetWeightToStore, 
        isStoreLoading, 
        setIsStoreLoading,
        loadMoreStores,
        hasMoreStores: pagination.links?.next !== null,
        loadingMore
    };

}



