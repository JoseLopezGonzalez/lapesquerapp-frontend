import { getToastTheme } from "@/customs/reactHotToast";
import { getActiveOrdersOptions } from "@/services/orderService";
import { createPallet, getPallet, updatePallet } from "@/services/palletService";
import { getProductOptions } from "@/services/productService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const recalculatePalletStats = (pallet) => {
    const numberOfBoxes = pallet.boxes.length;
    const netWeight = pallet.boxes.reduce(
        (total, box) => total + parseFloat(box.netWeight || 0),
        0
    );

    return {
        ...pallet,
        numberOfBoxes,
        netWeight: parseFloat(netWeight.toFixed(3)) // 3 decimales
    };
};

const initialboxCreationData = {
    productId: "",
    lot: "",
    netWeight: "",
    weights: "", // para masiva
    totalWeight: "", // para promedio
    numberOfBoxes: "", // para promedio
    scannedCode: "", // para lector
    deleteScannedCode: "",//para lector eliminar
};

function generateUniqueIntId() {
    // Usa timestamp + número aleatorio para asegurar unicidad
    return Math.floor(Date.now() + Math.random() * 1000);
}

const emptyPallet = {
    id: null,
    observations: '',
    state: { id: 2, name: 'Almacenado' }, // opcional
    articlesNames: [],
    boxes: [],
    lots: [],
    netWeight: 0,
    position: null,
    store: null,
    orderId: null,
    numberOfBoxes: 0,

};




export function usePallet({ id, onChange, initialStoreId = null, initialOrderId = null }) {

    const [pallet, setPallet] = useState(null);
    const [temporalPallet, setTemporalPallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [activeOrdersOptions, setActiveOrdersOptions] = useState([])
    const [productsOptions, setProductsOptions] = useState([]);
    const [boxCreationData, setBoxCreationData] = useState(initialboxCreationData)

    useEffect(() => {
        setError(null);
        setLoading(true);
        setTemporalPallet(null);
        // NUEVO: si no hay id => crear palet temporal nuevo
        if (id === 'new') {
            setPallet({
                ...emptyPallet,
                store: initialStoreId ? { id: initialStoreId } : null, // Asignar store si se proporciona
                orderId: initialOrderId || null, // Asignar orderId si se proporciona
            });
            setLoading(false);
        } else {
            getPallet(id, token)
                .then((data) => {
                    setPallet(data);
                })
                .catch((err) => {
                    setError(err.message || 'Error al cargar el palet');
                })
                .finally(() => {
                    setLoading(false);
                });
        }

        getActiveOrdersOptions(token)
            .then((data) => {
                setActiveOrdersOptions(data);
            })
            .catch((err) => {
                console.error('Error al cargar las opciones de pedidos:', err);
            });
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
            });
    }, [id, token, reload]);

    const onClose = () => {
        setTimeout(() => {
        setPallet(null);
        setTemporalPallet(null);
        setLoading(false);
        setError(null);
        setReload(false);
        setBoxCreationData(initialboxCreationData);
        }, 1000); // Esperar un poco para que se cierre el modal antes de resetear
        
    };

    useEffect(() => {
        if (pallet) {
            setTemporalPallet({ ...pallet })
            setBoxCreationData(initialboxCreationData); // Resetear datos de creación de caja
            console.log('Pallet loaded:', pallet);
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

    const getGs1128 = (productId, lot, netWeight) => {
        const boxGtin = getBoxGtinById(productId);
        const formattedNetWeight = netWeight.toFixed(2).replace('.', '').padStart(6, '0');
        return `(01)${boxGtin}(3100)${formattedNetWeight}(10)${lot}`;
    }

    /* ----------------- */


    /* Add box */
    const addBox = (box) => {
        if (!temporalPallet) return;
        const uniqueId = generateUniqueIntId(); // Generar un nuevo ID único
        const gs1128 = getGs1128(box.product.id, box.lot, box.netWeight);
        const boxWithId = { ...box, id: uniqueId, new: true, gs1128, grossWeight: box.netWeight }; // Añadir el ID y marcar como nueva
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

        const newBox = { ...boxToDuplicate, id: Date.now(), new: true }; // Generar un nuevo ID único
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: [...(prev.boxes || []), newBox]
            })));

        toast.success('Caja duplicada correctamente', getToastTheme());
    };

    /* Delete box */
    const deleteBox = (boxId) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: prev.boxes.filter((box) => box.id !== boxId)
            })));
        toast.success('Caja eliminada correctamente', getToastTheme());
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
                        box.id === boxId ? { ...box, lot: lot } : box
                    )
                })));
        },
        netWeight: (boxId, netWeight) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) =>
                        box.id === boxId ? { ...box, netWeight: netWeight } : box
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

    const editPallet = {
        box: {
            add: addBox,
            duplicate: duplicateBox,
            delete: deleteBox,
            edit: editBox
        },
        observations: editObservations,
        orderId: editOrderId

    }

    const boxCreationDataChange = (field, value) => {
        setBoxCreationData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    useEffect(() => {
        if (boxCreationData.scannedCode.length >= 42) {
            onAddNewBox({ method: 'lector' });
            setBoxCreationData(initialboxCreationData); // Resetear datos de creación de caja
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
        const { productId, lot, netWeight, weights, totalWeight, numberOfBoxes, scannedCode } = boxCreationData;

        if (method === 'manual') {
            if (!productId || !lot || !netWeight) {
                toast.error('Por favor, completa todos los campos requeridos', getToastTheme());
                return;
            }
            const product = getProductById(productId); // Validar que el producto existe
            const newBox = {
                product: product,
                lot,
                netWeight: parseFloat(netWeight),
                scannedCode
            };
            addBox(newBox);
        } else if (method === 'average') {
            if (!productId || !totalWeight || !numberOfBoxes) {
                toast.error('Por favor, completa todos los campos requeridos', getToastTheme());
                return;
            }
            const averageNetWeight = parseFloat(totalWeight / numberOfBoxes).toFixed(3);
            for (let i = 0; i < numberOfBoxes; i++) {
                const product = getProductById(productId);
                const newBox = {
                    product: product,
                    lot,
                    netWeight: parseFloat(averageNetWeight),
                    scannedCode
                };
                addBox(newBox);
            }
        } else if (method === 'bulk') {
            if (!productId || !weights) {
                toast.error('Por favor, completa todos los campos requeridos.', getToastTheme());
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
                toast.error('Algunas líneas tienen símbolos no permitidos o pesos negativos. Revisa los datos e intenta de nuevo.', getToastTheme());
                return;
            }

            if (weightsArray.length === 0) {
                toast.error('Por favor, ingresa al menos un peso válido.', getToastTheme());
                return;
            }

            // Agregar las cajas ahora que sabemos que están bien
            weightsArray.forEach((weight) => {
                const product = getProductById(productId);
                const newBox = {
                    product: product,
                    lot,
                    netWeight: weight,
                    scannedCode,
                };
                addBox(newBox);
            });

            toast.success(`Se agregaron ${weightsArray.length} cajas correctamente`, getToastTheme());
        } else if (method === 'lector') {
            if (!scannedCode) {
                toast.error('Por favor, escanea un código válido.', getToastTheme());
                return;
            }

            const match = scannedCode.match(/\(01\)(\d{14})\(3100\)(\d{6})\(10\)(.+)/);
            if (!match) {
                toast.error('Formato de código escaneado no válido.', getToastTheme());
                return;
            }

            const [, gtin, weightStr, lotFromCode] = match;
            const netWeight = parseFloat(weightStr) / 100;

            const product = productsOptions.find(p => p.boxGtin === gtin);
            if (!product) {
                toast.error(`No se encontró ningún producto con GTIN ${gtin}`, getToastTheme());
                return;
            }

            const newBox = {
                product: {
                    id: product.value,
                    name: product.label
                },
                lot: lotFromCode,
                netWeight,
                scannedCode
            };

            addBox(newBox);
            toast.success('Caja añadida correctamente por lector', getToastTheme());
        }

        setBoxCreationData(initialboxCreationData); // Resetear datos de creación de caja
    }

    const onDeleteScannedCode = () => {
        if (!temporalPallet) return;

        const scannedCode = boxCreationData.deleteScannedCode.trim();
        if (!scannedCode) {
            toast.error('Por favor, escanea un código válido para eliminar.', getToastTheme());
            return;
        }

        const boxToDelete = temporalPallet.boxes.find(box => box.gs1128 === scannedCode);
        if (!boxToDelete) {
            toast.error('No se encontró ninguna caja que coincida con el código escaneado.', getToastTheme());
            return;
        }

        setTemporalPallet(prev =>
            recalculatePalletStats({
                ...prev,
                boxes: prev.boxes.filter(box => box.id !== boxToDelete.id)
            })
        );

        toast.success('Caja eliminada correctamente por lector', getToastTheme());
        setBoxCreationData(prev => ({ ...prev, deleteScannedCode: '' }));
    };


    const onResetBoxCreationData = () => {
        setBoxCreationData(initialboxCreationData);
    };

    const deleteAllBoxes = () => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => (
            recalculatePalletStats({
                ...prev,
                boxes: []
            })
        ));
        toast.success('Todas las cajas han sido eliminadas', getToastTheme());
    };

    const resetAllChanges = () => {
        console.log("resetAllChanges: pallet =", pallet);
        setTemporalPallet({ ...pallet });
        setBoxCreationData(initialboxCreationData);
        toast.success('Cambios desechos', getToastTheme());
    };


    const getPieChartData = Object.entries(temporalProductsSummary).map(([productName, data]) => ({
        name: productName,
        value: parseFloat(data.totalNetWeight.toFixed(2))
    }));



    const onSavingChanges = async () => {
        if (!temporalPallet) return;

        console.log('Saving changes for pallet:', temporalPallet);

        if (temporalPallet.id === null) {
            createPallet(temporalPallet, token)
                .then((data) => {
                    console.log('Pallet created successfully:', data);
                    setPallet(data);
                    onChange(data); // Notificar al componente padre del cambio
                    toast.success('Palet creado correctamente', getToastTheme());
                })
                .catch((err) => {
                    console.error('Error al crear el palet:', err);
                    toast.error(err.message || 'Error al crear el palet', getToastTheme());
                });


        } else {
            updatePallet(temporalPallet.id, temporalPallet, token)
                .then((data) => {
                    console.log('Pallet updated successfully:', data);
                    setPallet(data);
                    onChange(data); // Notificar al componente padre del cambio
                    toast.success('Palet actualizado correctamente', getToastTheme());
                })
                .catch((err) => {
                    console.error('Error al actualizar el palet:', err);
                    toast.error(err.message || 'Error al actualizar el palet', getToastTheme());
                });
        }


    };







    return {
        pallet,
        reloadPallet,
        loading,
        temporalPallet,
        temporalProductsSummary,
        temporalTotalProducts,
        error,
        temporalTotalLots,
        temporalUniqueLots,
        activeOrdersOptions,
        editPallet,
        productsOptions,
        boxCreationData,
        boxCreationDataChange,
        onResetBoxCreationData,
        onAddNewBox,
        deleteAllBoxes,
        resetAllChanges,
        getPieChartData,
        onSavingChanges,
        onClose,
    };

}
