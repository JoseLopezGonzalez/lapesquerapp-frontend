"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Link as LinkIcon, Loader2, Info } from "lucide-react";
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { linkAllPurchases, validatePurchases, groupLinkedSummaryBySupplier } from "@/services/export/linkService";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";

export default function MassiveLinkPurchasesDialog({ 
    open, 
    onOpenChange, 
    documents,
    linkedSummaryGenerators 
}) {
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

        // Group by supplierId and date (combine multiple barcos with same supplier)
        const groupedSummary = groupLinkedSummaryBySupplier(summary);
        setAllLinkedSummary(groupedSummary);

        // Validate purchases when dialog opens
        if (groupedSummary.length > 0) {
            const validItems = groupedSummary.filter(item => !item.error);
            if (validItems.length > 0) {
                setIsValidating(true);
                validatePurchases(groupedSummary)
                    .then((validation) => {
                        // Create a map for quick lookup
                        const validationMap = {};
                        validation.validationResults.forEach((result) => {
                            const key = `${result.supplierId}_${result.date}`;
                            validationMap[key] = result;
                        });
                        setValidationResults(validationMap);
                    })
                    .catch((error) => {
                        console.error('Error al validar:', error);
                        toast.error('Error al validar recepciones', getToastTheme());
                    })
                    .finally(() => {
                        setIsValidating(false);
                    });
            }
        }
    }, [open, documents, linkedSummaryGenerators]);

    // Initialize selections when linkedSummary changes
    useEffect(() => {
        if (allLinkedSummary.length === 0) {
            setSelectedLinks([]);
            return;
        }

        // Select by default only those without error
        const initialSelection = allLinkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        setSelectedLinks(initialSelection);
    }, [allLinkedSummary.length]);

    // Function to handle selection/deselection of a line
    const handleToggleLink = (index) => {
        setSelectedLinks(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Function to select/deselect all lines without error and that can be updated
    const handleToggleAll = () => {
        const validIndices = allLinkedSummary
            .map((linea, index) => {
                if (linea.error) return null;
                const key = `${linea.supplierId}_${linea.date.split('/').reverse().join('-')}`;
                const validation = validationResults[key];
                // Only include if valid and can update
                return (validation?.valid && validation?.canUpdate) ? index : null;
            })
            .filter(index => index !== null);
        
        if (selectedLinks.length === validIndices.length) {
            // If all are selected, deselect all
            setSelectedLinks([]);
        } else {
            // If not all are selected, select all valid ones
            setSelectedLinks(validIndices);
        }
    };

    // Get validation status for a linea
    const getValidationStatus = (linea) => {
        const key = `${linea.supplierId}_${linea.date.split('/').reverse().join('-')}`;
        return validationResults[key] || null;
    };

    const handleLinkPurchases = async () => {
        // Filter only selected purchases that are valid and can be updated
        const comprasSeleccionadas = allLinkedSummary.filter((linea, index) => {
            if (!selectedLinks.includes(index)) return false;
            if (linea.error) return false;
            
            // Check validation status
            const validation = getValidationStatus(linea);
            if (!validation || !validation.valid || !validation.canUpdate) return false;
            
            return true;
        });

        if (comprasSeleccionadas.length === 0) {
            toast.error('No hay compras seleccionadas para vincular.', getToastTheme());
            return;
        }

        setIsLinking(true);
        try {
            // Link all selected purchases
            const result = await linkAllPurchases(comprasSeleccionadas);

            if (result.correctas > 0) {
                toast.success(`Compras enlazadas correctamente (${result.correctas})`, getToastTheme());
            }

            if (result.errores > 0) {
                // Show detailed errors for first few failures
                const erroresAMostrar = result.erroresDetalles.slice(0, 3);
                erroresAMostrar.forEach((errorDetail) => {
                    const barcoInfo = errorDetail.barcoNombre ? `${errorDetail.barcoNombre}: ` : '';
                    toast.error(`${barcoInfo}${errorDetail.error}`, {
                        ...getToastTheme(),
                        duration: 6000,
                    });
                });
                
                if (result.errores > 3) {
                    toast.error(`${result.errores - 3} error(es) adicional(es). Revisa la consola para más detalles.`, getToastTheme());
                }
            }

            if (result.correctas === 0 && result.errores === 0) {
                toast.info('No hay compras válidas para enlazar', getToastTheme());
            }

            // Close dialog on success
            if (result.correctas > 0) {
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error al enlazar:', error);
            toast.error(`Error al enlazar: ${error.message}`, getToastTheme());
        } finally {
            setIsLinking(false);
        }
    };

    const validLinksCount = allLinkedSummary.filter(l => !l.error).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {allLinkedSummary.length > 0 ? 'Enlaces de compra/recepción' : 'Enlazar Compras - Modo Masivo'}
                    </DialogTitle>
                    <DialogDescription>
                        {allLinkedSummary.length > 0 ? (
                            <>
                                {allLinkedSummary.length} Compras de {documents?.length || 0} documento(s)
                                {allLinkedSummary.some(l => l.isGrouped) && (
                                    <span className="text-blue-600 ml-1">(algunas agrupadas)</span>
                                )}
                            </>
                        ) : (
                            'Seleccione las compras que desea enlazar. Puede filtrar por barco y fecha.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 flex-1 overflow-hidden flex flex-col min-h-0">
                    {allLinkedSummary.length > 0 ? (
                        <Card className="flex flex-col flex-1 min-h-0">
                            <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0 p-4">
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox 
                                                    checked={
                                                        allLinkedSummary.filter((l, idx) => {
                                                            if (l.error) return false;
                                                            const validation = getValidationStatus(l);
                                                            return validation?.valid && validation?.canUpdate;
                                                        }).length > 0 &&
                                                        selectedLinks.length === allLinkedSummary.filter((l, idx) => {
                                                            if (l.error) return false;
                                                            const validation = getValidationStatus(l);
                                                            return validation?.valid && validation?.canUpdate;
                                                        }).length
                                                    }
                                                    onCheckedChange={handleToggleAll}
                                                    disabled={isValidating}
                                                />
                                            </TableHead>
                                            <TableHead className="min-w-[250px]">Barco</TableHead>
                                            <TableHead className="w-32">Fecha</TableHead>
                                            <TableHead className="text-right w-32">Peso Neto</TableHead>
                                            <TableHead className="text-right w-36">Importe</TableHead>
                                            <TableHead className="w-40">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allLinkedSummary.map((linea, index) => {
                                            const validation = getValidationStatus(linea);
                                            const isDisabled = linea.error || (validation && !validation.valid);
                                            const canSelect = !linea.error && validation?.valid && validation?.canUpdate;
                                            const isGrouped = linea.isGrouped || false;
                                            
                                            return (
                                                <TableRow 
                                                    key={index} 
                                                    className={`hover:bg-muted/50 ${isGrouped ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <TableCell>
                                                        <Checkbox 
                                                            checked={selectedLinks.includes(index)}
                                                            disabled={isDisabled || isValidating}
                                                            onCheckedChange={() => handleToggleLink(index)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium min-w-[250px]">
                                                        {isGrouped ? (
                                                            <span className="flex items-center gap-1 flex-wrap">
                                                                <span className="font-semibold text-blue-700 break-words">{linea.barcoNombre}</span>
                                                                <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">Agrupado</span>
                                                            </span>
                                                        ) : (
                                                            <span className="break-words">{linea.barcoNombre}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{linea.date}</TableCell>
                                                    <TableCell className="text-right">{formatDecimalWeight(linea.declaredTotalNetWeight)}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatDecimalCurrency(linea.declaredTotalAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {linea.error ? (
                                                            <div className="flex items-center gap-2 text-red-500">
                                                                <X className="h-4 w-4" />
                                                                <span className="text-xs">No enlazable</span>
                                                            </div>
                                                        ) : isValidating ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span className="text-xs">Validando...</span>
                                                            </div>
                                                        ) : validation ? (
                                                            validation.valid && validation.canUpdate ? (
                                                                validation.hasChanges ? (
                                                                    <div className="flex items-center gap-2 text-green-500">
                                                                        <Check className="h-4 w-4" />
                                                                        <span className="text-xs">Listo para actualizar</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-blue-500">
                                                                        <Info className="h-4 w-4" />
                                                                        <span className="text-xs">Sin cambios</span>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="flex items-start gap-2 text-red-500">
                                                                    <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs font-medium">No se puede enlazar</span>
                                                                        {validation.message && (
                                                                            <span 
                                                                                className="text-xs text-red-400 cursor-help" 
                                                                                title={validation.tooltip || validation.message}
                                                                            >
                                                                                {validation.message}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <span className="text-xs">Pendiente</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No hay compras disponibles para enlazar.</p>
                        </div>
                    )}
                </div>

                {allLinkedSummary.length > 0 && (
                    <DialogFooter>
                        <div className="flex justify-between items-center w-full">
                            <span className="text-sm text-muted-foreground">
                                {selectedLinks.length} de {allLinkedSummary.filter((l, idx) => {
                                    if (l.error) return false;
                                    const validation = getValidationStatus(l);
                                    return validation?.valid && validation?.canUpdate;
                                }).length} seleccionadas
                            </span>
                            <Button 
                                variant="default" 
                                onClick={handleLinkPurchases}
                                disabled={selectedLinks.length === 0 || isLinking || isValidating}
                            >
                                {isLinking ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enlazando...
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon className="h-4 w-4 mr-2" />
                                        Enlazar Compras ({selectedLinks.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

