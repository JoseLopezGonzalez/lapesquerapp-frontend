import { getStore, getStores } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";


export function useStore(storeId) {
    const { data: session, status } = useSession();
    const token = session?.user?.accessToken;
    const [store, setStore] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const [filters, setFilters] = useState({
        types: {
            pallet: true,
            box: true,
            tub: true,
        },
        products: [],
    });

    const onChangeFilters = (newFilters) => {
        setFilters(newFilters);
    }

    

    const [filteredPositionsMap, setFilteredPositionsMap] = useState(new Map());

    useEffect(() => {
        const map = new Map();

        store?.content?.pallets?.forEach(pallet => {
            if (!pallet.position) return;

            const matchProduct = pallet.boxes?.some(box => filters.products.includes(box.article?.id));

            if (matchProduct) {
                map.set(pallet.position, true);
            }
        });

        setFilteredPositionsMap(map);
    }, [store, filters]);



   




    useEffect(() => {
        setLoading(true);
        if (!token) return;
        getStore(storeId, token)
            .then((data) => {
                setStore(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error al obtener los almacenes', error);
                setError(error);
                setLoading(false);
            });
    }, [reload, token, storeId]);

    const isPositionFilled = (positionId) => {
        return store?.content?.pallets?.some(p => p.position === positionId) ?? false;
    }

    const getAvailableProducts = () => {
        const productsMap = new Map();

        store?.content?.pallets?.forEach(pallet => {
            if (!pallet.position) return
            pallet.boxes?.forEach(box => {
                const product = box.article;
                if (product?.id) {
                    productsMap.set(product.id, product); // evitar duplicados
                }
            });
        });

        return Array.from(productsMap.values());
    }

    const productsOptions = getAvailableProducts().map(product => ({
        value: product.id,
        label: product.name
    }));


    return {
        store,
        loading,
        error,
        isPositionFilled,
        productsOptions,
        onChangeFilters,
        filteredPositionsMap,
    };

}
