import { getStore, getStores } from "@/services/storeService";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";


const initialFilters = {
    types: {
        pallet: true,
        box: true,
        tub: true,
    },
    products: [],
    pallets: [],
};

export function useStore(storeId) {
    const { data: session } = useSession();
    const token = session?.user?.accessToken;
    const [store, setStore] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);

    const [filters, setFilters] = useState(initialFilters);

    const onChangeFilters = (newFilters) => {
        setFilters(newFilters);
    }

    const resetFilters = () => {
        setFilters(initialFilters);
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

    const palletsOptions = store?.content?.pallets?.map(pallet => {
        return {
            value: pallet.id,
            label: pallet.id
        }
    });

    /* quantity per Especie Summary */
    const [quantityPerEspecie, setQuantityPerEspecie] = useState([]);
    useEffect(() => {
        const map = new Map();
        store?.content?.pallets?.forEach(pallet => {
            pallet.boxes?.forEach(box => {
                const product = box.article;
                if (product?.species?.name) {
                    const currentQuantity = map.get(product?.species?.name) ?? 0;
                    map.set(product?.species?.name, currentQuantity + Number(box.netWeight));
                }
            });
        });

        const quantityArray = Array.from(map.entries()).map(([name, quantity]) => ({
            name,
            quantity
        }));

        setQuantityPerEspecie(quantityArray);
    }, [store]);

    console.log('quantityPerEspecie', quantityPerEspecie);



    const [filteredPositionsMap, setFilteredPositionsMap] = useState(new Map());

    useEffect(() => {
        const map = new Map();

        store?.content?.pallets?.forEach(pallet => {
            if (!pallet.position) return;

            const matchProduct = pallet.boxes?.some(box => filters.products.includes(box.article?.id));

            const matchPallet = filters.pallets.includes(pallet.id);

            if (matchProduct || matchPallet) {
                map.set(pallet.position, pallet);

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



    return {
        store,
        loading,
        error,
        isPositionFilled,

        onChangeFilters,
        filteredPositionsMap,





        filters,
        resetFilters,
        palletsOptions,
        productsOptions,
    };

}
