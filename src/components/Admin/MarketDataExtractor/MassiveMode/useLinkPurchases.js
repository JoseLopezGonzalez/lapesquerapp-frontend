"use client";

import { useState, useEffect } from "react";
import { validatePurchases, groupLinkedSummaryBySupplier, linkAllPurchases } from "@/services/export/linkService";
import { notify } from "@/lib/notifications";

/**
 * Hook for managing link purchases state and logic in MassiveLinkPurchasesDialog
 */
export function useLinkPurchases({ open, documents, linkedSummaryGenerators, onSuccess }) {
    const [selectedLinks, setSelectedLinks] = useState([]);
    const [isLinking, setIsLinking] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [allLinkedSummary, setAllLinkedSummary] = useState([]);
    const [validationResults, setValidationResults] = useState({});

    // Generate linkedSummary for all documents, group by supplier, and validate
    useEffect(() => {
        if (!open || !documents || documents.length === 0) {
            setAllLinkedSummary([]);
            setValidationResults({});
            return;
        }

        const summary = [];
        documents.forEach((doc) => {
            const generator = linkedSummaryGenerators[doc.documentType];
            if (generator && doc.processedData && doc.processedData.length > 0) {
                const linkedSummary = generator(doc.processedData[0]);
                if (linkedSummary && linkedSummary.length > 0) {
                    summary.push(...linkedSummary);
                }
            }
        });

        const groupedSummary = groupLinkedSummaryBySupplier(summary);
        setAllLinkedSummary(groupedSummary);

        if (groupedSummary.length > 0) {
            const validItems = groupedSummary.filter(item => !item.error);
            if (validItems.length > 0) {
                setIsValidating(true);
                validatePurchases(groupedSummary)
                    .then((validation) => {
                        const validationMap = {};
                        validation.validationResults.forEach((result) => {
                            const key = `${result.supplierId}_${result.date}`;
                            validationMap[key] = result;
                        });
                        setValidationResults(validationMap);
                    })
                    .catch((error) => {
                        console.error('Error al validar:', error);
                        notify.error({ title: 'Error al validar recepciones' });
                    })
                    .finally(() => {
                        setIsValidating(false);
                    });
            }
        }
    }, [open, documents, linkedSummaryGenerators]);

    useEffect(() => {
        if (allLinkedSummary.length === 0) {
            setSelectedLinks([]);
            return;
        }
        if (isValidating) return;
        const validationKeysCount = Object.keys(validationResults).length;
        if (validationKeysCount === 0 && allLinkedSummary.some(l => !l.error)) return;

        const initialSelection = allLinkedSummary
            .map((linea, index) => {
                if (linea.error) return null;
                const validation = getValidationStatus(linea);
                return (validation?.valid && validation?.canUpdate && validation?.hasChanges) ? index : null;
            })
            .filter(index => index !== null);
        setSelectedLinks(initialSelection);
    }, [allLinkedSummary.length, isValidating, Object.keys(validationResults).length]);

    const getValidationStatus = (linea) => {
        const key = `${linea.supplierId}_${linea.date.split('/').reverse().join('-')}`;
        return validationResults[key] || null;
    };

    const handleToggleLink = (index) => {
        setSelectedLinks(prev => {
            if (prev.includes(index)) return prev.filter(i => i !== index);
            return [...prev, index];
        });
    };

    const handleToggleAll = () => {
        const validIndices = allLinkedSummary
            .map((linea, index) => {
                if (linea.error) return null;
                const validation = getValidationStatus(linea);
                return (validation?.valid && validation?.canUpdate) ? index : null;
            })
            .filter(index => index !== null);

        if (selectedLinks.length === validIndices.length) {
            setSelectedLinks([]);
        } else {
            setSelectedLinks(validIndices);
        }
    };

    const handleLinkPurchases = async () => {
        const comprasSeleccionadas = allLinkedSummary.filter((linea, index) => {
            if (!selectedLinks.includes(index)) return false;
            if (linea.error) return false;
            const validation = getValidationStatus(linea);
            if (!validation || !validation.valid || !validation.canUpdate) return false;
            return true;
        });

        if (comprasSeleccionadas.length === 0) {
            notify.error({ title: 'No hay compras seleccionadas para vincular.' });
            return;
        }

        setIsLinking(true);
        try {
            const result = await linkAllPurchases(comprasSeleccionadas);

            if (result.correctas > 0) {
                notify.success({ title: `Compras enlazadas correctamente (${result.correctas})` });
            }
            if (result.errores > 0) {
                const erroresAMostrar = result.erroresDetalles.slice(0, 3);
                erroresAMostrar.forEach((errorDetail) => {
                    const barcoInfo = errorDetail.barcoNombre ? `${errorDetail.barcoNombre}: ` : '';
                    notify.error({ title: `${barcoInfo}${errorDetail.error}` }, { duration: 6000 });
                });
                if (result.errores > 3) {
                    notify.error({ title: `${result.errores - 3} error(es) adicional(es).` });
                }
            }
            if (result.correctas === 0 && result.errores === 0) {
                notify.info({ title: 'No hay compras válidas para enlazar' });
            }
            if (result.correctas > 0 && onSuccess) onSuccess();
        } catch (error) {
            console.error('Error al enlazar:', error);
            notify.error({ title: `Error al enlazar: ${error.message}` });
        } finally {
            setIsLinking(false);
        }
    };

    return {
        allLinkedSummary,
        selectedLinks,
        validationResults,
        isValidating,
        isLinking,
        getValidationStatus,
        handleToggleLink,
        handleToggleAll,
        handleLinkPurchases,
    };
}
