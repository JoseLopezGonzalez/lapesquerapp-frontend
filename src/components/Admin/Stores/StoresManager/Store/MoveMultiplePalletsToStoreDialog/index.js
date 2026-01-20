"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";
import { Warehouse, Check, Search, X, Package, Loader2, Layers } from "lucide-react";
import Loader from "@/components/Utilities/Loader";
import { moveMultiplePalletsToStore } from "@/services/palletService";
import { useStoreContext } from "@/context/StoreContext";
import { useStoresOptions } from "@/hooks/useStoresOptions";
import { Badge } from "@/components/ui/badge";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from "@/helpers/pallet/boxAvailability";

export default function MoveMultiplePalletsToStoreDialog() {
    const {
        closeMoveMultiplePalletsToStoreDialog,
        isOpenMoveMultiplePalletsToStoreDialog: isOpen,
        store,
        updateStoreWhenOnMoveMultiplePalletsToStore
    } = useStoreContext();

    const { data: session } = useSession();
    const token = session?.user?.accessToken;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStoreValue, setSelectedStoreValue] = useState(null);
    const [selectedPalletIds, setSelectedPalletIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { storeOptions, loading: storesLoading } = useStoresOptions();

    // Obtener todos los pallets del almacén actual
    const allPallets = useMemo(() => {
        return store?.content?.pallets || [];
    }, [store]);

    // Filtrar almacenes según búsqueda
    const filteredStores = storeOptions.filter((store) =>
        store.label?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtrar pallets según búsqueda
    const [palletSearchQuery, setPalletSearchQuery] = useState("");
    const filteredPallets = useMemo(() => {
        if (!palletSearchQuery) return allPallets;
        const query = palletSearchQuery.toLowerCase();
        return allPallets.filter(pallet => 
            pallet.id.toString().toLowerCase().includes(query) ||
            pallet.lots?.some(lot => lot.toLowerCase().includes(query))
        );
    }, [allPallets, palletSearchQuery]);

    const resetAndClose = () => {
        setSelectedStoreValue(null);
        setSearchQuery("");
        setPalletSearchQuery("");
        setSelectedPalletIds(new Set());
        closeMoveMultiplePalletsToStoreDialog();
    };

    const handleTogglePallet = (palletId) => {
        setSelectedPalletIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(palletId)) {
                newSet.delete(palletId);
            } else {
                newSet.add(palletId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedPalletIds.size === filteredPallets.length) {
            setSelectedPalletIds(new Set());
        } else {
            setSelectedPalletIds(new Set(filteredPallets.map(p => p.id)));
        }
    };

    const handleSubmit = async () => {
        if (!selectedStoreValue) {
            toast.error("Seleccione un almacén de destino", getToastTheme());
            return;
        }

        if (selectedPalletIds.size === 0) {
            toast.error("Seleccione al menos un palet para mover", getToastTheme());
            return;
        }

        setIsSubmitting(true);
        const palletIdsArray = Array.from(selectedPalletIds).map(id => Number(id));

        try {
            const response = await moveMultiplePalletsToStore(palletIdsArray, Number(selectedStoreValue), token);
            
            const { moved_count, total_count, errors } = response;

            // Mostrar mensaje de éxito con detalles
            if (moved_count > 0) {
                let message = `Se movieron ${moved_count} palet(s) correctamente`;
                if (errors && errors.length > 0) {
                    message += `. ${total_count - moved_count} palet(s) no se pudieron mover.`;
                }
                toast.success(message, getToastTheme());
            }

            // Mostrar errores individuales si existen
            if (errors && errors.length > 0) {
                errors.forEach(({ pallet_id, error }) => {
                    toast.error(`Palet #${pallet_id}: ${error}`, getToastTheme());
                });
            }

            // Actualizar el store
            updateStoreWhenOnMoveMultiplePalletsToStore({
                palletIds: palletIdsArray,
                storeId: Number(selectedStoreValue)
            });

            resetAndClose();
        } catch (error) {
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || "Error al mover los palets";
            toast.error(errorMessage, getToastTheme());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStoreClick = (value) => {
        setSelectedStoreValue((prev) => (prev === value ? null : value));
    };

    if (!isOpen) return null;

    const selectedCount = selectedPalletIds.size;
    const allSelected = filteredPallets.length > 0 && selectedPalletIds.size === filteredPallets.length;

    // Función helper para obtener información del pallet
    const getPalletInfo = (pallet) => {
        const availableBoxes = getAvailableBoxes(pallet.boxes || []);
        const availableBoxCount = getAvailableBoxesCount(pallet);
        const availableNetWeight = getAvailableNetWeight(pallet);

        const productsSummary = availableBoxes.reduce((acc, box) => {
            const product = box.product;
            if (!acc[product.id]) {
                acc[product.id] = {
                    name: product.name,
                    netWeight: 0,
                    boxCount: 0,
                };
            }
            acc[product.id].netWeight += Number(box.netWeight);
            acc[product.id].boxCount += 1;
            return acc;
        }, {});
        const productsSummaryArray = Object.values(productsSummary);
        const hasMultipleProducts = productsSummaryArray.length > 1;

        return {
            availableBoxCount,
            availableNetWeight,
            productsSummaryArray,
            hasMultipleProducts,
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Traspaso masivo de palets</DialogTitle>
                    <DialogDescription>
                        Seleccione los palets que desea mover y el almacén de destino
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex gap-4">
                    {/* Sección izquierda: Selección de pallets */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Seleccionar palets ({selectedCount} seleccionados)
                            </h3>
                            {filteredPallets.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                                </Button>
                            )}
                        </div>

                        {/* Buscador de pallets */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar palet por ID o lote..."
                                className="pl-9"
                                value={palletSearchQuery}
                                onChange={(e) => setPalletSearchQuery(e.target.value)}
                            />
                            {palletSearchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-7 w-7"
                                    onClick={() => setPalletSearchQuery("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Lista de pallets */}
                        <ScrollArea className="flex-1 border rounded-md">
                            {filteredPallets.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-6">
                                    {allPallets.length === 0 
                                        ? "No hay palets en este almacén" 
                                        : "No se encontraron palets"}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 p-3">
                                    {filteredPallets.map((pallet) => {
                                        const isSelected = selectedPalletIds.has(pallet.id);
                                        const palletInfo = getPalletInfo(pallet);
                                        
                                        return (
                                            <Card
                                                key={pallet.id}
                                                className={`cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? "border-primary bg-accent shadow-md" 
                                                        : "hover:border-primary/50"
                                                }`}
                                                onClick={() => handleTogglePallet(pallet.id)}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleTogglePallet(pallet.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            {/* Header con ID */}
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex items-center bg-black text-white p-1.5 rounded-md gap-2 flex-shrink-0">
                                                                    <Layers className="h-4 w-4" />
                                                                </div>
                                                                <h4 className="font-medium text-base text-foreground truncate">
                                                                    Palet #{pallet.id}
                                                                </h4>
                                                            </div>

                                                            {/* Productos */}
                                                            <div className="mb-2">
                                                                <div className="text-xs font-medium text-muted-foreground mb-1.5">Productos:</div>
                                                                <div className="space-y-2">
                                                                    {palletInfo.productsSummaryArray.map((product, index) => (
                                                                        <div key={index} className="flex flex-col overflow-hidden min-w-0">
                                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                                {product.name}
                                                                            </p>
                                                                            {palletInfo.hasMultipleProducts && (
                                                                                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                                                                    <span className="truncate">{formatDecimalWeight(product.netWeight)}</span>
                                                                                    <span className="mx-1.5 flex-shrink-0">|</span>
                                                                                    <span className="flex-shrink-0">
                                                                                        {product.boxCount} {product.boxCount === 1 ? "caja" : "cajas"}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Lotes */}
                                                            {pallet.lots && pallet.lots.length > 0 && (
                                                                <div className="mb-2">
                                                                    <div className="text-xs font-medium text-muted-foreground mb-1">Lotes:</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {pallet.lots.map((lot, idx) => (
                                                                            <Badge key={idx} variant="outline" className="bg-accent text-accent-foreground border-input text-xs truncate max-w-full">
                                                                                <span className="truncate">{lot}</span>
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Observaciones */}
                                                            {pallet.observations && (
                                                                <div className="mb-2">
                                                                    <div className="text-xs font-medium text-muted-foreground mb-1">Observaciones:</div>
                                                                    <div className="text-xs text-foreground bg-muted/50 p-2 rounded-md break-words line-clamp-3">
                                                                        {pallet.observations}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                
                                                {/* Footer con resumen */}
                                                <CardFooter className="p-0 w-full">
                                                    <div className="w-full grid grid-cols-2 divide-x divide-border">
                                                        <div className="flex items-center justify-center py-2 bg-accent/40">
                                                            <span className="text-sm font-semibold">
                                                                {palletInfo.availableBoxCount} {palletInfo.availableBoxCount === 1 ? "caja" : "cajas"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-center py-2 bg-accent/40">
                                                            <span className="text-sm font-semibold">
                                                                {formatDecimalWeight(palletInfo.availableNetWeight)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Separador vertical */}
                    <div className="w-px bg-border" />

                    {/* Sección derecha: Selección de almacén */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            Almacén de destino
                        </h3>

                        {/* Buscador de almacenes */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar almacén..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-7 w-7"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Lista de almacenes */}
                        {storesLoading ? (
                            <div className="flex flex-col items-center justify-center flex-1">
                                <Loader />
                            </div>
                        ) : filteredStores.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-6 border rounded-md flex-1 flex items-center justify-center">
                                No se encontraron almacenes
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 border rounded-md">
                                <div className="flex flex-col gap-2 p-3">
                                    {filteredStores.map((store) => {
                                        const isSelected = selectedStoreValue === store.value;
                                        return (
                                            <div
                                                key={store.value}
                                                className={`flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
                                                    isSelected ? "border-primary bg-accent" : ""
                                                }`}
                                                onClick={() => handleStoreClick(store.value)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{store.label}</span>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!selectedStoreValue || selectedCount === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Moviendo...
                            </>
                        ) : (
                            `Mover ${selectedCount} palet(s)`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

