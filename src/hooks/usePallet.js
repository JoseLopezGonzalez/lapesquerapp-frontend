import { getToastTheme } from "@/customs/reactHotToast";
import { getActiveOrdersOptions } from "@/services/orderService";
import { getPallet } from "@/services/palletService";
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
};





export function usePallet(id) {

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
        if (!id) return; // 🚫 no hacer nada si no hay id
        setError(null);
        setLoading(true);
        setTemporalPallet(null);
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
            }
            );

    }, [id, token, reload]);

    useEffect(() => {
        if (pallet) {
            setTemporalPallet({ ...pallet })
        }
    }, [pallet]);

    const reloadPallet = () => {
        setReload(!reload);
    };


    const temporalProductsSummary = temporalPallet?.boxes?.reduce((acc, box) => {
        const productName = box.article.name;
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
    temporalPallet?.boxes.forEach((box) => temporalUniqueLots.add(box.lot));
    const temporalTotalLots = temporalUniqueLots.size;

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


    /* Edit Temporal Pallet */
    /* Add box */
    const addBox = (box) => {
        if (!temporalPallet) return;
        const uniqueId = Date.now() + Math.random(); // Generar un nuevo ID único
        const gs1128 = getGs1128(box.article.id, box.lot, box.netWeight);
        const boxWithId = { ...box, id: uniqueId, new: true, gs1128 }; // Añadir el ID y marcar como nueva
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
        article: (boxId, article) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => (
                recalculatePalletStats({
                    ...prev,
                    boxes: prev.boxes.map((box) =>
                        box.id === boxId ? { ...box, article: article } : box
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
                article: product,
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
                    article: product,
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
                    article: product,
                    lot,
                    netWeight: weight,
                    scannedCode,
                };
                addBox(newBox);
            });

            toast.success(`Se agregaron ${weightsArray.length} cajas correctamente`, getToastTheme());
        }

        setBoxCreationData(initialboxCreationData); // Resetear datos de creación de caja
    }

    const onResetBoxCreationData = () => {
        setBoxCreationData(initialboxCreationData);
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
    };

}
