import { getActiveOrdersOptions } from "@/services/orderService";
import { getPallet } from "@/services/palletService";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function usePallet(id) {

    const [pallet, setPallet] = useState(null);
    const [temporalPallet, setTemporalPallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reload, setReload] = useState(false);
    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [activeOrdersOptions, setActiveOrdersOptions] = useState([])

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


    /* Edit Temporal Pallet */
    /* Add box */
    const addBox = (box) => {
        if (!temporalPallet) return;
        const boxWithId = { ...box, id: Date.now() }; // Generar un nuevo ID único
        setTemporalPallet((prev) => ({
            ...prev,
            boxes: [...(prev.boxes || []), boxWithId]
        }));
    };

    /* duplicate box */
    const duplicateBox = (boxId) => {
        if (!temporalPallet) return;
        const boxToDuplicate = temporalPallet.boxes.find((box) => box.id === boxId);
        if (!boxToDuplicate) return;

        const newBox = { ...boxToDuplicate, id: Date.now() }; // Generar un nuevo ID único
        setTemporalPallet((prev) => ({
            ...prev,
            boxes: [...(prev.boxes || []), newBox]
        }));
    };

    /* Delete box */
    const deleteBox = (boxId) => {
        if (!temporalPallet) return;
        setTemporalPallet((prev) => ({
            ...prev,
            boxes: prev.boxes.filter((box) => box.id !== boxId)
        }));
    };
    /* Edit box */
    const editBox = {
        article: (boxId, article) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => ({
                ...prev,
                boxes: prev.boxes.map((box) =>
                    box.id === boxId ? { ...box, article: article } : box
                )
            }));
        },
        lot: (boxId, lot) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => ({
                ...prev,
                boxes: prev.boxes.map((box) =>
                    box.id === boxId ? { ...box, lot: lot } : box
                )
            }));
        },
        netWeight: (boxId, netWeight) => {
            if (!temporalPallet) return;
            setTemporalPallet((prev) => ({
                ...prev,
                boxes: prev.boxes.map((box) =>
                    box.id === boxId ? { ...box, netWeight: netWeight } : box
                )
            }));
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
        activeOrdersOptions
    };

}
