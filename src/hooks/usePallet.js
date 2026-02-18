import { getActiveOrdersOptions } from "@/services/orderService";
import { createPallet, getPallet, updatePallet } from "@/services/palletService";
import { getProductOptions } from "@/services/productService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getAvailableBoxesCount, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";
import { notify } from "@/lib/notifications";

/**
 * Soporte para códigos GS1-128 con peso en libras (3200):
 * - 3100: peso en kg (formato original)
 * - 3200: peso en libras (se convierte automáticamente a kg usando factor 0.453592)
 * 
 * Formato esperado: 01GTIN3100peso10lote o 01GTIN3200peso10lote
 */

const recalculatePalletStats = (pallet) => {
    // Usar valores del backend si están disponibles, sino calcular desde las cajas
    // Esto es necesario para palets temporales o nuevos que aún no tienen estos campos
    const numberOfBoxes = getAvailableBoxesCount(pallet);
    const netWeight = getAvailableNetWeight(pallet);

    return {
        ...pallet,
        numberOfBoxes,
        netWeight: parseFloat(netWeight.toFixed(3)) // 3 decimales
    };
};

// Funciones helper para guardar/recuperar preferencias de descuento desde localStorage
const STORAGE_KEYS = {
    showPalletWeight: 'pallet_creation_showPalletWeight',
    showBoxTare: 'pallet_creation_showBoxTare',
    palletWeight: 'pallet_creation_palletWeight',
    boxTare: 'pallet_creation_boxTare',
};

const getStoredValue = (key, defaultValue) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return defaultValue;
        // Para valores booleanos
        if (defaultValue === false || defaultValue === true) {
            return stored === 'true';
        }
        // Para valores string (números como string)
        return stored;
    } catch (error) {
        console.error(`Error reading from localStorage for key ${key}:`, error);
        return defaultValue;
    }
};

const setStoredValue = (key, value) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, String(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key ${key}:`, error);
    }
};

/**
 * Guarda las preferencias de descuento en localStorage
 * @param {Object} boxCreationData - Datos de creación de cajas con las preferencias
 * NOTA: Deshabilitado - ya no se guarda en memoria para que el usuario elija cada vez
 */
export const saveDiscountPreferences = (boxCreationData) => {
    // Memoria deshabilitada - no se guardan las preferencias
    // El usuario debe elegir cada vez que entra al editor
    return;
    // if (!boxCreationData) return;
    // setStoredValue(STORAGE_KEYS.showPalletWeight, boxCreationData.showPalletWeight || false);
    // setStoredValue(STORAGE_KEYS.showBoxTare, boxCreationData.showBoxTare || false);
    // setStoredValue(STORAGE_KEYS.palletWeight, boxCreationData.palletWeight || '');
    // setStoredValue(STORAGE_KEYS.boxTare, boxCreationData.boxTare || '');
};

const getInitialBoxCreationData = (preserveDiscounts = false, currentDiscounts = null) => {
    return {
        productId: "",
        lot: "",
        netWeight: "",
        weights: "", // para masiva
        totalWeight: "", // para promedio
        numberOfBoxes: "", // para promedio
        palletWeight: preserveDiscounts && currentDiscounts?.palletWeight !== undefined 
            ? currentDiscounts.palletWeight 
            : "", // peso del palet/soporte de madera para descontar en promedio - sin memoria
        showPalletWeight: preserveDiscounts && currentDiscounts?.showPalletWeight !== undefined 
            ? currentDiscounts.showPalletWeight 
            : false, // mostrar/ocultar campo de peso del palet - sin memoria
        boxTare: preserveDiscounts && currentDiscounts?.boxTare !== undefined 
            ? currentDiscounts.boxTare 
            : "", // tara de cada caja para descontar en promedio - sin memoria
        showBoxTare: preserveDiscounts && currentDiscounts?.showBoxTare !== undefined 
            ? currentDiscounts.showBoxTare 
            : false, // mostrar/ocultar campo de tara de cajas - sin memoria
        scannedCode: "", // para lector
        deleteScannedCode: "",//para lector eliminar
        gs1codes: "", // <- NUEVO
    };
};

const initialboxCreationData = getInitialBoxCreationData();

let nextBoxId = Date.now(); // base inicial

function generateUniqueIntId() {
    return nextBoxId++;
}


const emptyPallet = {
    id: null,
    observations: '',
    state: { id: 1, name: 'Registrado' }, // Estado inicial: registrado pero no almacenado
    productsNames: [],
    boxes: [],
    lots: [],
    netWeight: 0,
    position: null,
    store: null,
    orderId: null,
    numberOfBoxes: 0,

};




export function usePallet({ id, onChange, initialStoreId = null, initialOrderId = null, skipBackendSave = false, initialPallet = null }) {

    const [pallet, setPallet] = useState(null);
    const [temporalPallet, setTemporalPallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [activeOrdersOptions, setActiveOrdersOptions] = useState([])
    const [activeOrdersLoading, setActiveOrdersLoading] = useState(true)
    const [productsOptions, setProductsOptions] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [boxCreationData, setBoxCreationData] = useState(initialboxCreationData)
    
    // Función helper para resetear boxCreationData preservando valores de descuento actuales
    const resetBoxCreationDataPreservingDiscounts = (currentData) => {
        const reset = getInitialBoxCreationData();
        return {
            ...reset,
            // Preservar los valores de descuento que el usuario está usando actualmente
            // Usar el valor actual si existe (incluso si es cadena vacía), sino usar el de reset
            palletWeight: currentData?.palletWeight !== undefined ? currentData.palletWeight : reset.palletWeight,
            showPalletWeight: currentData?.showPalletWeight !== undefined ? currentData.showPalletWeight : reset.showPalletWeight,
            boxTare: currentData?.boxTare !== undefined ? currentData.boxTare : reset.boxTare,
            showBoxTare: currentData?.showBoxTare !== undefined ? currentData.showBoxTare : reset.showBoxTare,
        };
    };

    useEffect(() => {
        setError(null);
        setLoading(true);
        setTemporalPallet(null);
        
        // Si no hay token, no continuar
        if (!token) {
            setError('No hay token de autenticación');
            setLoading(false);
            return;
        }
        
        // NUEVO: si no hay id => crear palet temporal nuevo
        if (id === 'new' || id === null) {
            // If initialPallet is provided, use it; otherwise create empty pallet
            const palletToSet = initialPallet || {
                ...emptyPallet,
                store: initialStoreId ? { id: initialStoreId } : null, // Asignar store si se proporciona
                orderId: initialOrderId || null, // Asignar orderId si se proporciona
            };
            setPallet(palletToSet);
            setLoading(false);
        } else {
            getPallet(id, token)
                .then((data) => {
                    setPallet(data);
                })
                .catch((err) => {
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar el palet';
                    setError(errorMessage);
                })
                .finally(() => {
                    setLoading(false);
                });
        }

        setActiveOrdersLoading(true)
        getActiveOrdersOptions(token)
            .then((data) => {
                setActiveOrdersOptions(data);
            })
            .catch((err) => {
                console.error('Error al cargar las opciones de pedidos:', err);
            })
            .finally(() => {
                setActiveOrdersLoading(false);
            });
        setProductsLoading(true);
        getProductOptions(token)
            .then((data) => {
                setProductsOptions(
                    data.map((product) => ({
                        value: product.id,
                        label: product.name,
                        boxGtin: product.boxGtin || null // Asegurarse de que boxGtin esté presente
                    }))
                );
            })
            .catch((err) => {
                console.error('Error al cargar las opciones de productos:', err);
            })
            .finally(() => {
                setProductsLoading(false);
            });
    }, [id, token, reload, initialStoreId, initialOrderId]);

    const onClose = () => {
        setTimeout(() => {
            setPallet(null);
            setTemporalPallet(null);
            setLoading(false);
            setError(null);
            setReload(false);
            setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
        }, 1000); // Esperar un poco para que se cierre el modal antes de resetear

    };

    useEffect(() => {
        if (pallet) {
            setTemporalPallet({ ...pallet })
            setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev)); // Resetear datos preservando descuentos
            // console.log('Pallet loaded:', pallet);
        }
    }, [pallet]);

    const reloadPallet = () => {
        setReload(!reload);
    };

    const temporalProductsSummary = temporalPallet?.boxes?.reduce((acc, box) => {
        const productName = box.product.name;
        const lot = box.lot;
        const netWeight = parseFloat(box.netWeight);

        if (!acc[productName]) {
            acc[productName] = {
                numberOfBoxes: 0,
                totalNetWeight: 0,
                lots: {}
            };
        }

        acc[productName].numberOfBoxes += 1;
        acc[productName].totalNetWeight += netWeight;

        if (!acc[productName].lots[lot]) {
            acc[productName].lots[lot] = [];
        }

        acc[productName].lots[lot].push(netWeight);

        return acc;
    }, {}) || {};
    const temporalTotalProducts = temporalProductsSummary && Object.keys(temporalProductsSummary).length;

    const temporalUniqueLots = new Set();
    temporalPallet?.boxes?.forEach((box) => temporalUniqueLots.add(box.lot));
    const temporalTotalLots = temporalUniqueLots.size;

    /* Generic Functions */

    const getProductById = (productId) => {
        const product = productsOptions.find((product) => product.value === productId);
        if (!product) return null;
        return {
            id: product.value,
            name: product.label
        };
    };

    const getBoxGtinById = (productId) => {
        const boxGtin = productsOptions.find((product) => product.value === productId).boxGtin;
        if (!boxGtin) return null;
        return boxGtin;
    };

    // Helper function para redondear peso neto a 2 decimales
    const roundToTwoDecimals = (weight) => {
        const num = parseFloat(weight);
        if (isNaN(num)) return 0;
        return parseFloat(num.toFixed(2));
    };

    const getGs1128 = (productId, lot, netWeight) => {
        const boxGtin = getBoxGtinById(productId);
        const weight = parseFloat(netWeight) || 0;
        const formattedNetWeight = weight.toFixed(2).replace('.', '').padStart(6, '0');
        return `(01)${boxGtin}(3100)${formattedNetWeight}(10)${lot}`;
    }

    const getGs1128WithPounds = (productId, lot, netWeightInPounds) => {
        const boxGtin = getBoxGtinById(productId);
        const formattedNetWeight = netWeightInPounds.toFixed(2).replace('.', '').padStart(6, '0');
        return `(01)${boxGtin}(3200)${formattedNetWeight}(10)${lot}`;
    }

    const convertScannedCodeToGs1128 = (scannedCode) => {
        // Intentar primero con 3100 - kg
        let match = scannedCode.match(/01(\d{14})3100(\d{6})10(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3100)${weightStr}(10)${lot}`;
        }
        
        // Si no coincide, intentar con 3200 - libras
        match = scannedCode.match(/01(\d{14})3200(\d{6})10(.+)/);
        if (match) {
            const [, gtin, weightStr, lot] = match;
            return `(01)${gtin}(3200)${weightStr}(10)${lot}`;
        }
        
        return null; // No se pudo convertir
    }

    /* ----------------- */


    /* Add box */
    const addBox = (box) => {
        if (!temporalPallet) return;
        const uniqueId = generateUniqueIntId(); // Generar un nuevo ID único
        // Asegurar que el peso neto tenga exactamente 2 decimales
        const roundedNetWeight = roundToTwoDecimals(box.netWeight);
        const boxWithRoundedWeight = { ...box, netWeight: roundedNetWeight };
        // Usar el código correcto según si es libras o kg
        const gs1128 = boxWithRoundedWeight.isPounds ? 
            getGs1128WithPounds(boxWithRoundedWeight.product.id, boxWithRoundedWeight.lot, boxWithRoundedWeight.originalWeightInPounds) : 
            getGs1128(boxWithRoundedWeight.product.id, boxWithRoundedWeight.lot, roundedNetWeight);
        const boxWithId = { ...boxWithRoundedWeight, id: uniqueId, new: true, gs1128, grossWeight: roundedNetWeight }; // Añadir el ID y marcar como nueva
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: [...(prev.boxes || []), boxWithId]
            })
        ));
    };

    /* duplicate box */
    const duplicateBox = (boxId) => {
        if (!temporalPallet) return;
        const boxToDuplicate = temporalPallet.boxes.find((box) => box.id === boxId);
        if (!boxToDuplicate) return;

        // Asegurar que el peso neto tenga exactamente 2 decimales
        const roundedNetWeight = roundToTwoDecimals(boxToDuplicate.netWeight);
        const newBox = { ...boxToDuplicate, id: generateUniqueIntId(), new: true, netWeight: roundedNetWeight }; // Generar un nuevo ID único
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: [...(prev.boxes || []), newBox]
            })));

        notify.success({ title: 'Caja duplicada', description: 'La caja se ha duplicado con el mismo producto, lote y peso.' });
    };

    /* Delete box */
    const deleteBox = (boxId) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: prev.boxes.filter((box) => box.id !== boxId)
            })));
        notify.success({ title: 'Caja eliminada', description: 'La caja se ha quitado del palet.' });
    };
    /* Edit box */
    const editBox = {
        product: (boxId, product) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) =>
                        box.id === boxId ? { ...box, product: product } : box
                    )
                })));
        },
        lot: (boxId, lot) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) =>
                        box.id === boxId ? { ...box, lot: lot, gs1128: getGs1128(box.product.id, lot, box.netWeight) } : box
                    )
                })));
        },
        netWeight: (boxId, netWeight) => {
            if (!temporalPallet) return;
            const roundedWeight = roundToTwoDecimals(netWeight);
            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) =>
                        box.id === boxId ? { ...box, netWeight: roundedWeight, gs1128: getGs1128(box.product.id, box.lot, roundedWeight) } : box
                    )
                })));
        }
    };

    /* Edit Observations */
    const editObservations = (observations) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => ({
            ...prev,
            observations: observations
        }));
    };
    /* Edit orderId */
    const editOrderId = (orderId) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => ({
            ...prev,
            orderId: orderId
        }));
    };

    /* Bulk edit boxes */
    const bulkEditBoxes = {
        /**
         * Cambia el lote de múltiples cajas disponibles
         * @param {Array<number>} boxIds - Array de IDs de cajas a editar. Si es null, edita todas las cajas disponibles
         * @param {string} lot - Nuevo lote a asignar
         */
        changeLot: (boxIds, lot) => {
            if (!temporalPallet) return;
            
            // Siempre filtrar solo cajas disponibles (no en producción)
            const boxesToEdit = boxIds 
                ? temporalPallet.boxes.filter(box => boxIds.includes(box.id) && box.isAvailable !== false)
                : temporalPallet.boxes.filter(box => box.isAvailable !== false);

            if (boxesToEdit.length === 0) {
                notify.error({ title: 'Sin cajas para editar', description: 'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.' });
                return;
            }

            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) => {
                        const shouldEdit = boxesToEdit.some(b => b.id === box.id);
                        if (shouldEdit) {
                            return { ...box, lot: lot, gs1128: getGs1128(box.product.id, lot, box.netWeight) };
                        }
                        return box;
                    })
                })
            ));

            notify.success({
                title: 'Lote actualizado',
                description: `Se ha cambiado el lote en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`
            });
        },
        
        /**
         * Cambia el peso neto de múltiples cajas disponibles
         * @param {Array<number>} boxIds - Array de IDs de cajas a editar. Si es null, edita todas las cajas disponibles
         * @param {number} netWeight - Nuevo peso neto a asignar
         */
        changeNetWeight: (boxIds, netWeight) => {
            if (!temporalPallet) return;
            
            // Siempre filtrar solo cajas disponibles (no en producción)
            const boxesToEdit = boxIds 
                ? temporalPallet.boxes.filter(box => boxIds.includes(box.id) && box.isAvailable !== false)
                : temporalPallet.boxes.filter(box => box.isAvailable !== false);

            if (boxesToEdit.length === 0) {
                notify.error({ title: 'Sin cajas para editar', description: 'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.' });
                return;
            }

            const parsedWeight = parseFloat(netWeight);
            if (isNaN(parsedWeight) || parsedWeight <= 0) {
                notify.error({ title: 'Peso no válido', description: 'El peso debe ser un número positivo.' });
                return;
            }

            const roundedWeight = roundToTwoDecimals(parsedWeight);

            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) => {
                        const shouldEdit = boxesToEdit.some(b => b.id === box.id);
                        if (shouldEdit) {
                            return { ...box, netWeight: roundedWeight, gs1128: getGs1128(box.product.id, box.lot, roundedWeight) };
                        }
                        return box;
                    })
                })
            ));

            notify.success({
                title: 'Peso actualizado',
                description: `Se ha cambiado el peso neto en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`
            });
        },
        
        /**
         * Suma o resta peso a múltiples cajas disponibles
         * @param {Array<number>} boxIds - Array de IDs de cajas a editar. Si es null, edita todas las cajas disponibles
         * @param {number} weightDifference - Peso a sumar o restar (positivo para sumar, negativo para restar)
         */
        addOrSubtractWeight: (boxIds, weightDifference) => {
            if (!temporalPallet) return;
            
            // Siempre filtrar solo cajas disponibles (no en producción)
            const boxesToEdit = boxIds 
                ? temporalPallet.boxes.filter(box => boxIds.includes(box.id) && box.isAvailable !== false)
                : temporalPallet.boxes.filter(box => box.isAvailable !== false);

            if (boxesToEdit.length === 0) {
                notify.error({ title: 'Sin cajas para editar', description: 'No hay cajas disponibles para editar. Solo se pueden modificar cajas que no estén en producción.' });
                return;
            }

            const parsedDifference = parseFloat(weightDifference);
            if (isNaN(parsedDifference)) {
                notify.error({ title: 'Peso no válido', description: 'El peso a sumar o restar debe ser un número válido.' });
                return;
            }

            if (parsedDifference === 0) {
                notify.error({ title: 'Peso cero', description: 'El peso a sumar o restar no puede ser cero.' });
                return;
            }

            // Contar cajas que tendrían peso <= 0 antes de actualizar
            const boxesWithInvalidResult = boxesToEdit.filter(box => {
                const currentWeight = parseFloat(box.netWeight) || 0;
                const newWeight = currentWeight + parsedDifference;
                return newWeight <= 0;
            }).length;

            setTemporalPallet((prev) => {
                const newBoxes = prev.boxes.map((box) => {
                    const shouldEdit = boxesToEdit.some(b => b.id === box.id);
                    if (shouldEdit) {
                        const currentWeight = parseFloat(box.netWeight) || 0;
                        const newWeight = roundToTwoDecimals(currentWeight + parsedDifference);
                        if (newWeight <= 0) {
                            return box; // No modificar cajas que resultarían con peso <= 0
                        }
                        return { ...box, netWeight: newWeight, gs1128: getGs1128(box.product.id, box.lot, newWeight) };
                    }
                    return box;
                });

                return recalculatePalletStats({
                    ...prev,
                    boxes: newBoxes
                });
            });

            const successfullyUpdated = boxesToEdit.length - boxesWithInvalidResult;
            if (boxesWithInvalidResult > 0) {
                notify.warning({
                    title: 'Edición parcial',
                    description: `${successfullyUpdated} ${successfullyUpdated === 1 ? 'caja actualizada' : 'cajas actualizadas'}. ${boxesWithInvalidResult} ${boxesWithInvalidResult === 1 ? 'caja no se pudo actualizar' : 'cajas no se pudieron actualizar'} porque el peso resultante sería negativo o cero.`
                });
            } else {
                const action = parsedDifference > 0 ? 'sumado' : 'restado';
                notify.success({
                    title: 'Peso actualizado',
                    description: `Se han ${action} ${Math.abs(parsedDifference)} kg en ${successfullyUpdated} ${successfullyUpdated === 1 ? 'caja disponible' : 'cajas disponibles'}.`
                });
            }
        },
        
        /**
         * Cambia el producto de múltiples cajas disponibles que tengan un producto específico
         * @param {Array<number>} boxIds - Array de IDs de cajas a editar. Si es null, edita todas las cajas disponibles con el producto especificado
         * @param {number} oldProductId - ID del producto actual a cambiar
         * @param {number} newProductId - ID del nuevo producto a asignar
         */
        changeProduct: (boxIds, oldProductId, newProductId) => {
            if (!temporalPallet) return;
            
            // Validar que se proporcionen ambos IDs
            if (!oldProductId || !newProductId) {
                notify.error({ title: 'Productos requeridos', description: 'Debe seleccionar el producto actual y el nuevo producto.' });
                return;
            }
            
            if (oldProductId === newProductId) {
                notify.error({ title: 'Producto duplicado', description: 'El producto nuevo debe ser diferente al actual.' });
                return;
            }
            
            // Obtener el nuevo producto
            const newProduct = getProductById(newProductId);
            if (!newProduct) {
                notify.error({ title: 'Producto no encontrado', description: 'El producto seleccionado no existe.' });
                return;
            }
            
            // Filtrar cajas disponibles con el producto especificado
            const boxesToEdit = boxIds 
                ? temporalPallet.boxes.filter(box => 
                    boxIds.includes(box.id) && 
                    box.isAvailable !== false && 
                    box.product?.id === oldProductId
                )
                : temporalPallet.boxes.filter(box => 
                    box.isAvailable !== false && 
                    box.product?.id === oldProductId
                );

            if (boxesToEdit.length === 0) {
                notify.error({ title: 'Sin cajas para editar', description: 'No hay cajas disponibles con el producto seleccionado. Solo se pueden modificar cajas que no estén en producción.' });
                return;
            }

            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) => {
                        const shouldEdit = boxesToEdit.some(b => b.id === box.id);
                        if (shouldEdit) {
                            return { 
                                ...box, 
                                product: newProduct,
                                gs1128: getGs1128(newProductId, box.lot, box.netWeight)
                            };
                        }
                        return box;
                    })
                })
            ));

            notify.success({
                title: 'Producto actualizado',
                description: `Se ha cambiado el producto en ${boxesToEdit.length} ${boxesToEdit.length === 1 ? 'caja disponible' : 'cajas disponibles'}.`
            });
        }
    };

    const editPallet = {
        box: {
            add: addBox,
            duplicate: duplicateBox,
            delete: deleteBox,
            edit: editBox,
            bulkEdit: bulkEditBoxes
        },
        observations: editObservations,
        orderId: editOrderId

    }

    const boxCreationDataChange = (field, value) => {
        setBoxCreationData((prev) => ({
            ...prev,
            [field]: value
        }));
        
        // Memoria deshabilitada - no se guardan las preferencias en localStorage
        // El usuario debe elegir cada vez que entra al editor
        // if (field === 'showPalletWeight') {
        //     setStoredValue(STORAGE_KEYS.showPalletWeight, value);
        // } else if (field === 'showBoxTare') {
        //     setStoredValue(STORAGE_KEYS.showBoxTare, value);
        // } else if (field === 'palletWeight') {
        //     setStoredValue(STORAGE_KEYS.palletWeight, value);
        // } else if (field === 'boxTare') {
        //     setStoredValue(STORAGE_KEYS.boxTare, value);
        // }
    };

    useEffect(() => {
        if (boxCreationData.scannedCode.length >= 42) {
            onAddNewBox({ method: 'lector' });
            setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev)); // Resetear datos preservando descuentos
        }
    }, [boxCreationData.scannedCode]);

    useEffect(() => {
        if (boxCreationData.deleteScannedCode.length >= 42) {
            onDeleteScannedCode();
            setBoxCreationData((prev) => ({ ...prev, deleteScannedCode: '' })); // Resetear campo de código escaneado para eliminar
        }
    }, [boxCreationData.deleteScannedCode]);

    const onAddNewBox = ({ method }) => {
        if (!temporalPallet) return;
        const { productId, lot, netWeight, weights, totalWeight, numberOfBoxes, palletWeight, boxTare, scannedCode } = boxCreationData;

        if (method === 'manual') {
            if (!productId || !lot || !netWeight) {
                notify.error({ title: 'Campos requeridos', description: 'Por favor, completa producto, lote y peso para crear la caja.' });
                return;
            }
            const product = getProductById(productId); // Validar que el producto existe
            const newBox = {
                product: product,
                lot,
                netWeight: roundToTwoDecimals(netWeight),
                scannedCode
            };
            addBox(newBox);
            notify.success({ title: 'Caja creada', description: 'Se ha añadido una caja al palet con el producto y peso indicados.' });
        } else if (method === 'average') {
            if (!productId || !totalWeight || !numberOfBoxes) {
                notify.error({ title: 'Campos requeridos', description: 'Por favor, completa producto, peso total y número de cajas.' });
                return;
            }
            
            // Guardar preferencias de descuento cuando se usan para crear cajas
            saveDiscountPreferences(boxCreationData);
            
            // Descontar el peso del palet si está definido (puede ser vacío o 0)
            const palletWeightValue = palletWeight ? parseFloat(palletWeight) : 0;
            // Descontar la tara de las cajas (tara por caja * número de cajas)
            const boxTareValue = boxTare ? parseFloat(boxTare) : 0;
            const totalBoxTare = boxTareValue * parseFloat(numberOfBoxes);
            const netTotalWeight = parseFloat(totalWeight) - palletWeightValue - totalBoxTare;
            const numberOfBoxesInt = parseInt(numberOfBoxes);
            const averageNetWeight = netTotalWeight / numberOfBoxesInt;
            
            // Calcular el peso para las primeras n-1 cajas (redondeado a 2 decimales)
            const standardWeight = roundToTwoDecimals(averageNetWeight);
            let accumulatedWeight = 0;
            
            for (let i = 0; i < numberOfBoxesInt; i++) {
                const product = getProductById(productId);
                let boxWeight;
                
                // La última caja ajusta la diferencia para que el total sea exacto
                if (i === numberOfBoxesInt - 1) {
                    // Calcular la diferencia exacta para la última caja
                    boxWeight = roundToTwoDecimals(netTotalWeight - accumulatedWeight);
                } else {
                    boxWeight = standardWeight;
                    accumulatedWeight += boxWeight;
                }
                
                const newBox = {
                    product: product,
                    lot,
                    netWeight: boxWeight,
                    scannedCode
                };
                addBox(newBox);
            }
            notify.success({
                title: 'Cajas creadas',
                description: `Se han creado ${numberOfBoxesInt} cajas con peso medio calculado a partir del total y la tara.`
            });
        } else if (method === 'bulk') {
            if (!productId || !weights) {
                notify.error({ title: 'Campos requeridos', description: 'Por favor, completa producto, lote y la lista de pesos (uno por línea).' });
                return;
            }

            // Prepara las líneas (sin líneas vacías)
            const weightsLines = weights
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '');

            // Validamos cada línea:
            let hasError = false;
            const weightsArray = [];

            weightsLines.forEach((line, index) => {
                // Reemplazar comas por puntos
                const cleanLine = line.replace(',', '.');

                // Verificar que solo haya caracteres numéricos, punto y espacios
                if (!/^\d*\.?\d+$/.test(cleanLine)) {
                    hasError = true;
                    return;
                }

                const weight = parseFloat(cleanLine);

                // Verificar que el peso sea positivo
                if (isNaN(weight) || weight <= 0) {
                    hasError = true;
                    return;
                }

                weightsArray.push(weight);
            });

            if (hasError) {
                notify.error({ title: 'Datos no válidos', description: 'Algunas líneas tienen símbolos no permitidos o pesos negativos. Usa solo números y punto decimal, uno por línea.' });
                return;
            }

            if (weightsArray.length === 0) {
                notify.error({ title: 'Sin pesos', description: 'Por favor, ingresa al menos un peso válido (número positivo) por línea.' });
                return;
            }

            // Agregar las cajas ahora que sabemos que están bien
            weightsArray.forEach((weight) => {
                const product = getProductById(productId);
                const newBox = {
                    product: product,
                    lot,
                    netWeight: roundToTwoDecimals(weight),
                    scannedCode,
                };
                addBox(newBox);
            });

            notify.success({
                title: 'Cajas agregadas',
                description: `Se han añadido ${weightsArray.length} cajas al palet con los pesos indicados.`
            });
        } else if (method === 'lector') {
            if (!scannedCode) {
                notify.error({ title: 'Código vacío', description: 'Por favor, escanea un código GS1-128 válido.' });
                return;
            }

            // Intentar primero con 3100 - kg
            let match = scannedCode.match(/01(\d{14})3100(\d{6})10(.+)/);
            let isPounds = false;
            
            // Si no coincide, intentar con 3200 - libras
            if (!match) {
                match = scannedCode.match(/01(\d{14})3200(\d{6})10(.+)/);
                isPounds = true;
            }
            
            if (!match) {
                notify.error({ title: 'Código no válido', description: 'Se espera formato GS1-128 con 3100 (kg) o 3200 (libras). Revisa el código escaneado.' });
                return;
            }

            const [, gtin, weightStr, lotFromCode] = match;
            let netWeight = parseFloat(weightStr) / 100;
            
            // Convertir libras a kg si es necesario (1 libra = 0.453592 kg)
            if (isPounds) {
                netWeight = netWeight * 0.453592;
            }
            
            // Redondear a 2 decimales
            netWeight = roundToTwoDecimals(netWeight);

            const product = productsOptions.find(p => p.boxGtin === gtin);
            if (!product) {
                notify.error({ title: 'Producto no encontrado', description: `No hay ningún producto con GTIN ${gtin}. Comprueba que el código corresponda a un producto dado de alta.` });
                return;
            }

            const newBox = {
                product: {
                    id: product.value,
                    name: product.label
                },
                lot: lotFromCode,
                netWeight,
                scannedCode,
                isPounds,
                originalWeightInPounds: isPounds ? parseFloat(weightStr) / 100 : null
            };

            addBox(newBox);
            notify.success({ title: 'Caja añadida', description: 'La caja se ha añadido al palet correctamente desde el código escaneado.' });
        } else if (method === 'gs1') {
            const { gs1codes } = boxCreationData;

            if (!gs1codes) {
                notify.error({ title: 'Códigos requeridos', description: 'Por favor, pega los códigos GS1-128, uno por línea.' });
                return;
            }

            const lines = gs1codes
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const parsedBoxes = [];
            const failedLines = [];

            for (const line of lines) {
                // Intentar primero con 3100 - kg
                let match = line.match(/01(\d{14})3100(\d{6})10(.+)/);
                let isPounds = false;
                
                // Si no coincide, intentar con 3200 - libras
                if (!match) {
                    match = line.match(/01(\d{14})3200(\d{6})10(.+)/);
                    isPounds = true;
                }
                
                if (!match) {
                    failedLines.push(line);
                    continue;
                }

                const [, gtin, weightStr, lot] = match;
                let netWeight = parseFloat(weightStr) / 100;
                
                // Convertir libras a kg si es necesario (1 libra = 0.453592 kg)
                if (isPounds) {
                    netWeight = netWeight * 0.453592;
                }
                
                // Redondear a 2 decimales
                netWeight = roundToTwoDecimals(netWeight);

                const product = productsOptions.find(p => p.boxGtin === gtin);

                if (!product) {
                    failedLines.push(line);
                    continue;
                }

                parsedBoxes.push({
                    product: { id: product.value, name: product.label },
                    lot,
                    netWeight,
                    scannedCode: line,
                    isPounds,
                    originalWeightInPounds: isPounds ? parseFloat(weightStr) / 100 : null
                });
            }

            if (parsedBoxes.length === 0) {
                notify.error({ title: 'Códigos no procesados', description: 'Ninguno de los códigos pudo ser procesado. Verifica que tengan formato 01(GTIN)3100/3200(peso)10(lote) y que los productos existan.' });
                return;
            }

            parsedBoxes.forEach(addBox);

            if (failedLines.length > 0) {
                notify.error({
                    title: 'Algunos códigos no reconocidos',
                    description: `${failedLines.length} ${failedLines.length === 1 ? 'código no' : 'códigos no'} fueron reconocidos. Revisa el formato (01+GTIN+3100/3200+peso+10+lote) y que los productos existan.`
                });
                console.warn("Códigos fallidos:", failedLines);
            } else {
                notify.success({
                    title: 'Cajas agregadas',
                    description: `Se han añadido ${parsedBoxes.length} cajas al palet desde los códigos GS1-128.`
                });
            }

            setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
        }


        setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev)); // Resetear datos preservando descuentos
    }

    const onDeleteScannedCode = () => {
        if (!temporalPallet) return;

        const scannedCode = boxCreationData.deleteScannedCode.trim();
        if (!scannedCode) {
            notify.error({ title: 'Código vacío', description: 'Por favor, escanea el código de la caja que quieres eliminar.' });
            return;
        }

        // Convertir el código escaneado sin paréntesis al formato con paréntesis
        const gs1128Code = convertScannedCodeToGs1128(scannedCode);
        if (!gs1128Code) {
            notify.error({ title: 'Código no válido', description: 'El formato del código escaneado no es válido para eliminar. Usa un código GS1-128 de una caja del palet.' });
            return;
        }

        
        const boxToDelete = temporalPallet.boxes.find(box => box.gs1128 === gs1128Code);
        if (!boxToDelete) {
            notify.error({ title: 'Caja no encontrada', description: 'No hay ninguna caja en este palet que coincida con el código escaneado.' });
            return;
        }

        setTemporalPallet(prev =>
            recalculatePalletStats({
                ...prev,
                boxes: prev.boxes.filter(box => box.id !== boxToDelete.id)
            })
        );

        notify.success({ title: 'Caja eliminada', description: 'La caja se ha eliminado del palet tras escanear su código.' });
        setBoxCreationData(prev => ({ ...prev, deleteScannedCode: '' }));
    };


    const onResetBoxCreationData = () => {
        // Preservar los valores de descuento actuales al resetear
        setBoxCreationData((prev) => {
            const reset = getInitialBoxCreationData();
            return {
                ...reset,
                // Preservar los valores de descuento que el usuario está usando actualmente
                palletWeight: prev.palletWeight || reset.palletWeight,
                showPalletWeight: prev.showPalletWeight !== undefined ? prev.showPalletWeight : reset.showPalletWeight,
                boxTare: prev.boxTare || reset.boxTare,
                showBoxTare: prev.showBoxTare !== undefined ? prev.showBoxTare : reset.showBoxTare,
            };
        });
    };

    const deleteAllBoxes = () => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: []
            })
        ));
        notify.success({ title: 'Todas las cajas eliminadas', description: 'Se han quitado todas las cajas del palet. Esta acción no se puede deshacer.' });
    };

    const resetAllChanges = () => {
        // console.log("resetAllChanges: pallet =", pallet);
        setTemporalPallet({ ...pallet });
        setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
        notify.success({ title: 'Cambios desechados', description: 'Se han descartado los cambios y el palet ha vuelto al estado anterior.' });
    };


    const getPieChartData = Object.entries(temporalProductsSummary).map(([productName, data]) => ({
        name: productName,
        value: parseFloat(data.totalNetWeight.toFixed(2))
    }));



    const onSavingChanges = async () => {
        if (!temporalPallet) return;

        // Guardar preferencias de descuento antes de guardar el palet
        saveDiscountPreferences(boxCreationData);

        // If skipBackendSave is true, just call onChange with temporalPallet without saving to backend
        if (skipBackendSave) {
            onChange(temporalPallet);
            return;
        }

        setSaving(true);

        // console.log('Saving changes for pallet:', temporalPallet);

        if (temporalPallet.id === null) {
            createPallet(temporalPallet, token)
                .then((data) => {
                    // console.log('Pallet created successfully:', data);
                    setPallet(data);
                    onChange(data); // Notificar al componente padre del cambio
                    notify.success({ title: 'Palet creado', description: 'El palet se ha guardado correctamente.' });
                })
                .catch((err) => {
                    console.error('Error al crear el palet:', err);
                    const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al crear el palet';
                    notify.error({ title: 'Error al crear el palet', description: errorMessage });
                })
                .finally(() => {
                    setSaving(false);
                });


        } else {
            updatePallet(temporalPallet.id, temporalPallet, token)
                .then((data) => {
                    // console.log('Pallet updated successfully:', data);
                    setPallet(data);
                    onChange(data); // Notificar al componente padre del cambio
                    notify.success({ title: 'Palet actualizado', description: 'Los cambios del palet se han guardado correctamente.' });
                })
                .catch((err) => {
                    console.error('Error al actualizar el palet:', err);
                    const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al actualizar el palet';
                    notify.error({ title: 'Error al actualizar el palet', description: errorMessage });
                })
                .finally(() => {
                    setSaving(false);
                });
        }


    };


    /* Set printed: true on box for boxId */

    const setBoxPrinted = (boxId) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => ({
            ...prev,
            boxes: prev.boxes.map((box) =>
                box.id === boxId ? { ...box, printed: true } : box
            )
        }));
    };







    return {
        pallet,
        reloadPallet,
        loading,
        saving,
        temporalPallet,
        temporalProductsSummary,
        temporalTotalProducts,
        error,
        temporalTotalLots,
        temporalUniqueLots,
        activeOrdersOptions,
        activeOrdersLoading,
        editPallet,
        productsOptions,
        productsLoading,
        boxCreationData,
        boxCreationDataChange,
        onResetBoxCreationData,
        onAddNewBox,
        deleteAllBoxes,
        resetAllChanges,
        getPieChartData,
        onSavingChanges,
        onClose,
        setBoxPrinted,
    };

}
