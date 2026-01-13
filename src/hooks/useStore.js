import { UNLOCATED_POSITION_ID } from "@/configs/config";
import { getToastTheme } from "@/customs/reactHotToast";
import { removePalletPosition, getPallet } from "@/services/palletService";
import { getStore, getStores, getRegisteredPallets } from "@/services/storeService";
import { REGISTERED_PALLETS_STORE_ID } from "@/hooks/useStores";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAvailableBoxes, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";





const initialFilters = {
    types: {
        pallet: true,
        box: true,
        tub: true,
    },
    products: [],
    pallets: [],
};

export function useStore({ storeId, onUpdateCurrentStoreTotalNetWeight, onAddNetWeightToStore, setIsStoreLoading }) {
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
    const [clonedPalletData, setClonedPalletData] = useState(null);
    const [isDuplicatingPallet, setIsDuplicatingPallet] = useState(false);

    const [isOpenPalletLabelDialog, setIsOpenPalletLabelDialog] = useState(false);
    const [palletLabelDialogData, setPalletLabelDialogData] = useState(null);

    const [isOpenMovePalletToStoreDialog, setIsOpenMovePalletToStoreDialog] = useState(false);
    const [movePalletToStoreDialogData, setMovePalletToStoreDialogData] = useState(null);

    const openMovePalletToStoreDialog = (palletId) => {
        setMovePalletToStoreDialogData(palletId);
        setIsOpenMovePalletToStoreDialog(true);
    }

    const closeMovePalletToStoreDialog = () => {
        setIsOpenMovePalletToStoreDialog(false);
        setTimeout(() => {
            setMovePalletToStoreDialogData(null);
        }, 1000); // Esperar a que se cierre el diálogo antes de limpiar los datos
    }

    const [isOpenMoveMultiplePalletsToStoreDialog, setIsOpenMoveMultiplePalletsToStoreDialog] = useState(false);

    const openMoveMultiplePalletsToStoreDialog = () => {
        setIsOpenMoveMultiplePalletsToStoreDialog(true);
    }

    const closeMoveMultiplePalletsToStoreDialog = () => {
        setIsOpenMoveMultiplePalletsToStoreDialog(false);
    }



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
    }) || [];

    /* quantity per Especie Summary */
    const [speciesSummary, setSpeciesSummary] = useState([]);

    useEffect(() => {
        const map = new Map();
        let totalWeight = 0;
        let totalProductWeight = 0;

        store?.content?.pallets?.forEach((pallet) => {
            // Solo contar cajas disponibles
            const availableBoxes = getAvailableBoxes(pallet.boxes || []);
            
            availableBoxes.forEach((box) => {
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

                    if (!speciesData.products.has(productName)) {
                        speciesData.products.set(productName, {
                            quantity: 0,
                            boxes: 0
                        });
                    }

                    const productData = speciesData.products.get(productName);
                    productData.quantity += netWeight;
                    productData.boxes += 1;
                }
            });
        });

        // Convert Map to plain objects
        const result = Array.from(map.values()).map((entry) => {
            const speciesPercentage = (entry.quantity / totalWeight) * 100;

            const products = Array.from(entry.products.entries()).map(([name, data]) => {
                const productPercentage = (data.quantity / totalProductWeight) * 100;
                return {
                    name,
                    quantity: data.quantity,
                    boxes: data.boxes,
                    productPercentage
                };
            });

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

        // Si no hay filtros activos, mostrar todos los palets
        const hasProductFilters = filters.products.length > 0;
        const hasPalletFilters = filters.pallets.length > 0;
        const hasActiveFilters = hasProductFilters || hasPalletFilters;

        store?.content?.pallets?.forEach(pallet => {
            // Determinar si el palet coincide con los filtros
            let matchesFilters = true;
            
            if (hasActiveFilters) {
                const matchProduct = hasProductFilters 
                    ? pallet.boxes?.some(box => filters.products.includes(box.product?.id))
                    : true;
                const matchPallet = hasPalletFilters
                    ? filters.pallets.includes(pallet.id)
                    : true;
                
                matchesFilters = matchProduct && matchPallet;
            }

            if (!matchesFilters) {
                return; // Saltar este palet si no coincide con los filtros
            }

            // Pallets SIN posición (unlocated)
            if (!pallet.position) {
                // Usamos la clave especial "unlocated"
                if (!map.has(UNLOCATED_POSITION_ID)) {
                    map.set(UNLOCATED_POSITION_ID, []);
                }
                map.get(UNLOCATED_POSITION_ID).push(pallet);
                return;
            }

            // Pallets CON posición
            if (!map.has(pallet.position)) {
                map.set(pallet.position, []);
            }
            map.get(pallet.position).push(pallet);
        });

        setFilteredPositionsMap(map);
    }, [store, filters, UNLOCATED_POSITION_ID]);




    // Calcular unlocatedPallets antes de usarlo
    const unlocatedPallets = useMemo(() => {
        return store?.content?.pallets
            ?.filter(pallet => !pallet.position)
            ?.sort((a, b) => a.id - b.id) ?? [];
    }, [store?.content?.pallets]);

    const isPositionRelevant = (positionId) => {
        // Solo es relevante si hay filtros activos Y la posición tiene palets que coinciden
        const hasProductFilters = filters.products.length > 0;
        const hasPalletFilters = filters.pallets.length > 0;
        const hasActiveFilters = hasProductFilters || hasPalletFilters;
        
        if (!hasActiveFilters) {
            return false; // Sin filtros = sin color verde
        }
        
        return filteredPositionsMap.has(positionId) && filteredPositionsMap.get(positionId).length > 0;
    };

    const isPositionFilled = (positionId) => {
        if (positionId === UNLOCATED_POSITION_ID) {
            return unlocatedPallets.length > 0;
        }
        return store?.content?.pallets?.some(p => p.position === positionId) ?? false;
    };

    const isPalletRelevant = (palletId) => {
        // Solo es relevante si hay filtros activos Y el palet coincide con los filtros
        const hasProductFilters = filters.products.length > 0;
        const hasPalletFilters = filters.pallets.length > 0;
        const hasActiveFilters = hasProductFilters || hasPalletFilters;
        
        if (!hasActiveFilters) {
            return false; // Sin filtros = sin color verde
        }
        
        // Recorre cada posición (incluida la de sin ubicar) para ver si el palet está en los filtrados
        for (const pallets of filteredPositionsMap.values()) {
            if (pallets.some(pallet => pallet.id === palletId)) {
                return true;
            }
        }
        return false;
    };






    useEffect(() => {
        setLoading(true);
        setIsStoreLoading(true);
        if (!token) return;
        
        // Si es el almacén fantasma, usar getRegisteredPallets, sino usar getStore
        const fetchStore = storeId === REGISTERED_PALLETS_STORE_ID 
            ? getRegisteredPallets(token)
            : getStore(storeId, token);
        
        fetchStore
            .then((data) => {
                console.log('useStore - Raw data from API:', data);
                console.log('useStore - data type:', typeof data);
                console.log('useStore - data is null?', data === null);
                console.log('useStore - data is undefined?', data === undefined);
                
                if (!data) {
                    console.error('useStore - ERROR: Data is null or undefined!');
                    setError(new Error('No se pudieron obtener los datos del almacén'));
                    return;
                }
                
                console.log('useStore - data.content:', data?.content);
                console.log('useStore - data.content?.pallets:', data?.content?.pallets);
                console.log('useStore - data.content?.pallets?.length:', data?.content?.pallets?.length);
                
                // Si es el almacén fantasma, asegurar que tenga el ID correcto
                if (storeId === REGISTERED_PALLETS_STORE_ID) {
                    // Si data no tiene content, usar el data completo pero asegurar el ID
                    const ghostStoreData = {
                        ...data,
                        id: REGISTERED_PALLETS_STORE_ID,
                        // Preservar el content original si existe, sino crear uno vacío
                        content: data?.content || {
                            pallets: [],
                            boxes: [],
                            bigBoxes: []
                        }
                    };
                    console.log('useStore - Setting ghost store data:', ghostStoreData);
                    console.log('useStore - Ghost store content:', ghostStoreData.content);
                    console.log('useStore - Ghost store pallets:', ghostStoreData.content?.pallets);
                    console.log('useStore - Ghost store pallets length:', ghostStoreData.content?.pallets?.length);
                    setStore(ghostStoreData);
                } else {
                    setStore(data);
                }
            })
            .catch((error) => {
                console.error('useStore - Error fetching store:', error);
                console.error('useStore - Error details:', error.message, error.stack);
            })
            .catch((error) => {
                console.error('Error al obtener los almacenes', error);
                setError(error);
            })
            .finally(() => {
                setIsStoreLoading(false);
                setLoading(false);

            });
    }, [reload, token, storeId]);

    /* const isPositionFilled = (positionId) => {
        return store?.content?.pallets?.some(p => p.position === positionId) ?? false;
    } */


    /* const getPositionPallets = (positionId) => {
        return store?.content?.pallets?.filter(p => p.position === positionId) ?? [];
    } */

    const getPositionPallets = (positionId) => {
        return store?.content?.pallets
            ?.filter(p => p.position === positionId)
            ?.sort((a, b) => a.id - b.id) ?? [];
    };

    const getPosition = (positionId) => {
        return store?.map?.posiciones?.find(p => p.id === positionId) ?? null;
    };



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



    const pallets = store?.content?.pallets || [];

    const openPalletDialog = (palletId) => {
        const pallet = pallets?.find(p => p.id === palletId);
        setPalletDialogData(palletId);
        setIsOpenPalletDialog(true);
    }

    const openCreatePalletDialog = () => {
        setPalletDialogData('new');
        setClonedPalletData(null);
        setIsOpenPalletDialog(true);
    }

    const closePalletDialog = () => {
        setIsOpenPalletDialog(false);
        setTimeout(() => {
            setPalletDialogData(null);
            setClonedPalletData(null);
        }, 1000); // Esperar a que se cierre el diálogo antes de limpiar los datos
    }

    // Función para generar IDs únicos temporales para cajas clonadas
    const generateUniqueBoxId = (() => {
        let nextId = Date.now();
        return () => nextId++;
    })();

    const openDuplicatePalletDialog = async (palletId) => {
        if (!token) {
            toast.error('No se pudo obtener el token de autenticación', getToastTheme());
            return;
        }

        // Mostrar toast de carga
        const loadingToastId = toast.loading('Duplicando...', getToastTheme());

        try {
            setIsDuplicatingPallet(true);
            // Obtener el palet completo
            const originalPallet = await getPallet(palletId, token);
            
            // Clonar el palet eliminando el ID y generando IDs únicos temporales para las cajas
            const clonedPallet = {
                ...originalPallet,
                id: null, // Eliminar el ID para que se cree como nuevo
                receptionId: null, // No mantener receptionId en el clon
                boxes: originalPallet.boxes?.map(box => ({
                    ...box,
                    id: generateUniqueBoxId(), // Generar ID único temporal para evitar errores de React con keys duplicadas
                    new: true, // Marcar como nuevas
                })) || [],
                store: originalPallet.store ? { id: originalPallet.store.id } : null, // Mantener el almacén
                storeId: originalPallet.storeId || originalPallet.store?.id || storeId, // Mantener el almacén actual
                orderId: null, // No mantener orderId en el clon
            };

            // Establecer el palet clonado y abrir el diálogo
            setClonedPalletData(clonedPallet);
            setPalletDialogData('new'); // Usar 'new' para indicar que es un nuevo palet
            setIsOpenPalletDialog(true);
            
            // Cerrar el toast de carga
            toast.dismiss(loadingToastId);
        } catch (error) {
            console.error('Error al duplicar el palet:', error);
            toast.dismiss(loadingToastId);
            toast.error(error.message || 'Error al duplicar el palet', getToastTheme());
        } finally {
            setIsDuplicatingPallet(false);
        }
    };

    /* const updateStoreWhenOnChangePallet = (updatedPallet) => {
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
    const updateStoreWhenOnChangePallet = (updatedPallet) => {
        setStore(prevStore => {
            const existingPallets = prevStore.content.pallets || [];
            const palletIndex = existingPallets.findIndex(p => p.id === updatedPallet.id);
            const isNewPallet = palletIndex === -1;
            const updatedPallets =
                palletIndex !== -1
                    ? existingPallets.map(p => (p.id === updatedPallet.id ? { ...p, ...updatedPallet } : p))
                    : [...existingPallets, updatedPallet];

            const newStore = {
                ...prevStore,
                content: {
                    ...prevStore.content,
                    pallets: updatedPallets
                }
            };

            const totalNetWeight = updatedPallets.reduce((total, pallet) => {
                // Usar valor del backend si está disponible, sino calcular desde cajas disponibles
                const palletNetWeight = getAvailableNetWeight(pallet);
                return total + palletNetWeight;
            }, 0);

            newStore.totalNetWeight = totalNetWeight;

            // console.log('Updated Store:', newStore);

            if (onUpdateCurrentStoreTotalNetWeight) onUpdateCurrentStoreTotalNetWeight(prevStore.id, newStore.totalNetWeight);
            return newStore;
        });

        // Si es un palet nuevo, actualizar el palletDialogData con el nuevo ID
        if (palletDialogData === 'new') {
            setPalletDialogData(updatedPallet.id);
        }
    };


    const updateStoreWhenOnMovePalletToStore = ({ palletId, storeId }) => {

        /*  */

        const pallet = store?.content?.pallets?.find(p => p.id === palletId);

        const palletTotalNetWeight = pallet.boxes?.reduce((sum, box) => sum + (box.netWeight || 0), 0) || 0;

        // console.log('storeId', storeId);
        // console.log('palletTotalNetWeight', palletTotalNetWeight);

        if (onAddNetWeightToStore) {
            onAddNetWeightToStore(storeId, palletTotalNetWeight);
        }

        setStore(prevStore => {
            const updatedPallets = prevStore.content.pallets.filter(pallet => pallet.id !== palletId);

            const newStore = {
                ...prevStore,
                content: {
                    ...prevStore.content,
                    pallets: updatedPallets
                }
            };
            const totalNetWeight = updatedPallets.reduce((total, pallet) => {
                // Usar valor del backend si está disponible, sino calcular desde cajas disponibles
                const palletNetWeight = getAvailableNetWeight(pallet);
                return total + palletNetWeight;
            }, 0);
            newStore.totalNetWeight = totalNetWeight;
            if (onUpdateCurrentStoreTotalNetWeight) onUpdateCurrentStoreTotalNetWeight(prevStore.id, newStore.totalNetWeight);

            return newStore;
        });
    };

    const updateStoreWhenOnMoveMultiplePalletsToStore = ({ palletIds, storeId }) => {
        const movedPallets = store?.content?.pallets?.filter(p => palletIds.includes(p.id)) || [];
        
        // Calcular el peso total de los pallets movidos
        const totalMovedWeight = movedPallets.reduce((sum, pallet) => {
            const palletTotalNetWeight = pallet.boxes?.reduce((boxSum, box) => boxSum + (box.netWeight || 0), 0) || 0;
            return sum + palletTotalNetWeight;
        }, 0);

        if (onAddNetWeightToStore) {
            onAddNetWeightToStore(storeId, totalMovedWeight);
        }

        setStore(prevStore => {
            const updatedPallets = prevStore.content.pallets.filter(pallet => !palletIds.includes(pallet.id));

            const newStore = {
                ...prevStore,
                content: {
                    ...prevStore.content,
                    pallets: updatedPallets
                }
            };
            const totalNetWeight = updatedPallets.reduce((total, pallet) => {
                const palletNetWeight = getAvailableNetWeight(pallet);
                return total + palletNetWeight;
            }, 0);

            newStore.totalNetWeight = totalNetWeight;

            if (onUpdateCurrentStoreTotalNetWeight) onUpdateCurrentStoreTotalNetWeight(prevStore.id, newStore.totalNetWeight);
            return newStore;
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



    const removePalletFromPosition = async (palletId) => {
        if (!token) return;

        try {
            await removePalletPosition(palletId, token);

            setStore(prevStore => {
                const updatedPallets = prevStore.content.pallets.map(pallet =>
                    pallet.id === palletId ? { ...pallet, position: null } : pallet
                );

                return {
                    ...prevStore,
                    content: {
                        ...prevStore.content,
                        pallets: updatedPallets
                    }
                };
            });

            toast.success("Posición eliminada correctamente", getToastTheme());
        } catch (error) {
            console.error("Error al quitar posición del palet", error);
            toast.error("Error al quitar la posición", getToastTheme());
        }
    };







    return {
        store,
        loading,
        error,
        isPositionFilled,

        onChangeFilters,
        filteredPositionsMap,
        removePalletFromPosition,




        filters,
        resetFilters,
        palletsOptions,
        productsOptions,
        speciesSummary,

        getPositionPallets,
        getPosition,
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
        clonedPalletData,
        openDuplicatePalletDialog,
        isDuplicatingPallet,

        isOpenUnallocatedPositionSlideover,
        openUnallocatedPositionSlideover,
        closeUnallocatedPositionSlideover,

        unlocatedPallets,
        isPositionRelevant,

        isPalletRelevant,
        updateStoreWhenOnChangePallet,
        openCreatePalletDialog,

        openPalletLabelDialog,
        closePalletLabelDialog,
        palletLabelDialogData,
        isOpenPalletLabelDialog,
        addElementToPositionDialogData,
        changePalletsPosition,

        openMovePalletToStoreDialog,
        closeMovePalletToStoreDialog,
        movePalletToStoreDialogData,
        isOpenMovePalletToStoreDialog,
        updateStoreWhenOnMovePalletToStore,

        openMoveMultiplePalletsToStoreDialog,
        closeMoveMultiplePalletsToStoreDialog,
        isOpenMoveMultiplePalletsToStoreDialog,
        updateStoreWhenOnMoveMultiplePalletsToStore,

    };

}
