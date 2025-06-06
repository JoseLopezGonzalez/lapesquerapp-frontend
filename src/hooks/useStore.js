import { UNLOCATED_POSITION_ID } from "@/configs/config";
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

    const [isOpenPositionSlideover, setIsOpenPositionSlideover] = useState(false);
    const [isOpenUnallocatedPositionSlideover, setIsOpenUnallocatedPositionSlideover] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);

    const [isOpenAddElementToPositionDialog, setIsOpenAddElementToPositionDialog] = useState(false);
    const [addElementToPositionDialogData, setAddElementToPositionDialogData] = useState(null);

    const [isOpenPalletDialog, setIsOpenPalletDialog] = useState(false);
    /* data */
    const [palletDialogData, setPalletDialogData] = useState(null);

    const [isOpenPalletLabelDialog, setIsOpenPalletLabelDialog] = useState(false);
    const [palletLabelDialogData, setPalletLabelDialogData] = useState(null);

    const openPalletLabelDialog = (palletId) => {
        const pallet = store?.content?.pallets?.find(p => p.id === palletId);
        if (!pallet) {
            console.error(`Pallet with ID ${palletId} not found`);
            return;
        }

        setPalletLabelDialogData(pallet);
        setIsOpenPalletLabelDialog(true);
    }

    const closePalletLabelDialog = () => {
        setIsOpenPalletLabelDialog(false);
        setTimeout(() => {
            setPalletLabelDialogData(null);
        }, 1000); // Esperar a que se cierre el diálogo antes de limpiar los datos
    }






    const openPositionSlideover = (positionId) => {
        setSelectedPosition(positionId);
        setIsOpenPositionSlideover(true);
    }


    const closePositionSlideover = () => {
        setSelectedPosition(null);
        setIsOpenPositionSlideover(false);
    }

    const openUnallocatedPositionSlideover = () => {
        setIsOpenUnallocatedPositionSlideover(true);
    }

    const closeUnallocatedPositionSlideover = () => {
        setIsOpenUnallocatedPositionSlideover(false);
    }

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
            pallet.boxes?.forEach(box => {
                const product = box.product;
                if (product?.id) {
                    productsMap.set(product.id, product); // evitar duplicados
                }
            });
        });

        return Array.from(productsMap.values());
    };


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
    const [speciesSummary, setSpeciesSummary] = useState([]);

    useEffect(() => {
        const map = new Map();
        let totalWeight = 0;
        let totalProductWeight = 0;

        store?.content?.pallets?.forEach((pallet) => {
            pallet.boxes?.forEach((box) => {
                const product = box.product;
                const speciesName = product?.species?.name;
                const productName = product?.name;
                const netWeight = Number(box.netWeight) || 0;

                if (speciesName && productName) {
                    totalWeight += netWeight;
                    totalProductWeight += netWeight;

                    if (!map.has(speciesName)) {
                        map.set(speciesName, {
                            name: speciesName,
                            quantity: 0,
                            products: new Map()
                        });
                    }

                    const speciesData = map.get(speciesName);
                    speciesData.quantity += netWeight;

                    const currentProductQuantity = speciesData.products.get(productName) ?? 0;
                    speciesData.products.set(productName, currentProductQuantity + netWeight);
                }
            });
        });

        // Convert Map to plain objects
        const result = Array.from(map.values()).map((entry) => {
            const speciesPercentage = (entry.quantity / totalWeight) * 100;

            const products = Array.from(entry.products.entries()).map(([name, quantity]) => {
                const productPercentage = (quantity / totalProductWeight) * 100;
                return { name, quantity, productPercentage };
            });

            /* ordenar productos por name */




            return {
                name: entry.name,
                quantity: entry.quantity,
                percentage: speciesPercentage,
                products: products.sort((a, b) => a.name.localeCompare(b.name))
            };
        });

        setSpeciesSummary(result);
    }, [store]);





    const [filteredPositionsMap, setFilteredPositionsMap] = useState(new Map());

    useEffect(() => {
        const map = new Map();

        store?.content?.pallets?.forEach(pallet => {
            // Pallets SIN posición (unlocated)
            if (!pallet.position) {
                const matchProduct = pallet.boxes?.some(box => filters.products.includes(box.product?.id));
                const matchPallet = filters.pallets.includes(pallet.id);

                if (matchProduct || matchPallet) {
                    // Usamos la clave especial "unlocated"
                    if (!map.has(UNLOCATED_POSITION_ID)) {
                        map.set(UNLOCATED_POSITION_ID, []);
                    }
                    map.get(UNLOCATED_POSITION_ID).push(pallet);
                }
                return;
            }

            // Pallets CON posición
            const matchProduct = pallet.boxes?.some(box => filters.products.includes(box.product?.id));
            const matchPallet = filters.pallets.includes(pallet.id);

            if (matchProduct || matchPallet) {
                if (!map.has(pallet.position)) {
                    map.set(pallet.position, []);
                }
                map.get(pallet.position).push(pallet);
            }
        });

        setFilteredPositionsMap(map);
    }, [store, filters]);




    const isPositionRelevant = (positionId) => {
        return filteredPositionsMap.has(positionId) && filteredPositionsMap.get(positionId).length > 0;
    };

    const isPositionFilled = (positionId) => {
        if (positionId === UNLOCATED_POSITION_ID) {
            return unlocatedPallets.length > 0;
        }
        return store?.content?.pallets?.some(p => p.position === positionId) ?? false;
    };

    const isPalletRelevant = (palletId) => {
        // Recorre cada posición (incluida la de sin ubicar)
        for (const pallets of filteredPositionsMap.values()) {
            if (pallets.some(pallet => pallet.id === palletId)) {
                return true;
            }
        }
        return false;
    };






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

    /* const isPositionFilled = (positionId) => {
        return store?.content?.pallets?.some(p => p.position === positionId) ?? false;
    } */


    const getPositionPallets = (positionId) => {
        return store?.content?.pallets?.filter(p => p.position === positionId) ?? [];
    }


    const openAddElementToPosition = (id) => {
        setIsOpenAddElementToPositionDialog(true);
        setAddElementToPositionDialogData(id);
    }

    const closeAddElementToPosition = () => {
        setIsOpenAddElementToPositionDialog(false);
        setTimeout(() => {
            setAddElementToPositionDialogData(null);
        }, 1000); // Esperar a que se cierre el diálogo antes de limpiar los datos
    }

    const unlocatedPallets = store?.content?.pallets?.filter(pallet => !pallet.position);

    const pallets = store?.content?.pallets;

    const openPalletDialog = (palletId) => {
        const pallet = pallets?.find(p => p.id === palletId);
        setPalletDialogData(palletId);
        setIsOpenPalletDialog(true);
    }

    const openCreatePalletDialog = () => {
        setPalletDialogData('new');
        setIsOpenPalletDialog(true);
    }

    const closePalletDialog = () => {
        setIsOpenPalletDialog(false);
        setTimeout(() => {
            setPalletDialogData(null);
        }, 1000); // Esperar a que se cierre el diálogo antes de limpiar los datos
    }

    /* const onChangePallet = (updatedPallet) => {
        const updatedPallets = pallets.map(pallet => {
            if (pallet.id === updatedPallet.id) {
                return { ...pallet, ...updatedPallet };
            }
            return pallet;
        });
        setStore(prevStore => ({
            ...prevStore,
            content: {
                ...prevStore.content,
                pallets: updatedPallets
            }
        }));
    } */
    const onChangePallet = (updatedPallet) => {
        setStore(prevStore => {
            const existingPallets = prevStore.content.pallets || [];

            const palletIndex = existingPallets.findIndex(p => p.id === updatedPallet.id);

            const updatedPallets =
                palletIndex !== -1
                    ? existingPallets.map(p => (p.id === updatedPallet.id ? { ...p, ...updatedPallet } : p))
                    : [...existingPallets, updatedPallet]; // Añadir si no existe

            return {
                ...prevStore,
                content: {
                    ...prevStore.content,
                    pallets: updatedPallets
                }
            };
        });
    };

    /* Change Position to PalletsIds */
    const changePalletsPosition = (palletsIds, positionId) => {
        setStore(prevStore => {
            const updatedPallets = prevStore.content.pallets.map(pallet => {
                if (palletsIds.includes(pallet.id)) {
                    return { ...pallet, position: positionId };
                }
                return pallet;
            });

            return {
                ...prevStore,
                content: {
                    ...prevStore.content,
                    pallets: updatedPallets
                }
            };
        });
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
        speciesSummary,

        getPositionPallets,
        openPositionSlideover,
        closePositionSlideover,
        isOpenPositionSlideover,
        selectedPosition,

        isOpenAddElementToPositionDialog,
        openAddElementToPosition,
        closeAddElementToPosition,

        unlocatedPallets,
        pallets,

        isOpenPalletDialog,
        openPalletDialog,
        closePalletDialog,
        palletDialogData,

        isOpenUnallocatedPositionSlideover,
        openUnallocatedPositionSlideover,
        closeUnallocatedPositionSlideover,

        unlocatedPallets,
        isPositionRelevant,

        isPalletRelevant,
        onChangePallet,
        openCreatePalletDialog,

        openPalletLabelDialog,
        closePalletLabelDialog,
        palletLabelDialogData,
        isOpenPalletLabelDialog,
        addElementToPositionDialogData,
        changePalletsPosition,


    };

}
