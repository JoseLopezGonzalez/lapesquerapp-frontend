"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";

import { PALLET_LABEL_SIZE } from "@/configs/config";

import { Copy, Trash2, Scan, Plus, Upload, Package, FileText, Edit, Eye, CloudAlert, RotateCcw, ChevronDown, Box, Truck, Layers, Weight, Link2Off, Printer, AlertCircle, Factory, CheckCircle, Loader2, ExternalLink, Minus } from "lucide-react";
import { PiShrimp } from "react-icons/pi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Combobox } from "@/components/Shadcn/Combobox";
import Loader from "@/components/Utilities/Loader";
import { EmptyState } from "@/components/Utilities/EmptyState";

import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { formatDateShort } from "@/helpers/formats/dates/formatDates";

import { usePallet } from "@/hooks/usePallet";
import { usePrintElement } from "@/hooks/usePrintElement";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";

import PalletLabel from "@/components/Admin/Pallets/PalletLabel";
import SummaryPieChart from "./SummaryPieChart";
import BoxesLabels from "./BoxesLabels";


export default function PalletView({ palletId, onChange = () => { }, initialStoreId = null, initialOrderId = null, wrappedInDialog = false, onSaveTemporal = null, initialPallet = null }) {

    const {
        productsOptions,
        boxCreationData,
        boxCreationDataChange,
        loading,
        saving,
        temporalPallet,
        error,
        temporalProductsSummary,
        temporalTotalProducts,
        temporalTotalLots,
        onResetBoxCreationData,
        activeOrdersOptions,
        editPallet,
        onAddNewBox,
        deleteAllBoxes,
        resetAllChanges,
        getPieChartData,
        onSavingChanges,
        onClose,
        setBoxPrinted,
    } = usePallet({ id: palletId, onChange, initialStoreId, initialOrderId, initialPallet });


    const orderIdBlocked = initialOrderId !== null;

    // Check if pallet belongs to a reception
    const receptionId = temporalPallet?.receptionId;
    const belongsToReception = receptionId !== null && receptionId !== undefined;
    const isReadOnly = belongsToReception;

    const { onPrint } = usePrintElement({ id: 'print-area-id', width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height });


    const handleOnClickPrintLabel = () => {
        onPrint();
    }

    const [selectedBox, setSelectedBox] = useState(null);
    const [activeTab, setActiveTab] = useState("disponibles");
    const [bulkActionType, setBulkActionType] = useState(null); // 'lot', 'weight' o 'weightAdd'
    const [bulkActionValue, setBulkActionValue] = useState('');
    const [weightOperation, setWeightOperation] = useState('add'); // 'add' o 'subtract'

    const handleOnClickBoxRow = (boxId) => {
        if (selectedBox === boxId) {
            setSelectedBox(null);
        } else {
            setSelectedBox(boxId);
        }
    };

    const handleOnChangeBoxLot = (boxId, lot) => {
        if (isReadOnly) return;
        // Check if box is available before allowing edit
        const box = temporalPallet?.boxes?.find(b => b.id === boxId);
        if (box && !isBoxAvailable(box)) {
            toast.error(`No se puede modificar el lote de la caja #${boxId}: está siendo usada en producción`, getToastTheme());
            return;
        }
        editPallet.box.edit.lot(boxId, lot);
    };

    const handleOnChangeBoxNetWeight = (boxId, netWeight) => {
        if (isReadOnly) return;
        // Check if box is available before allowing edit
        const box = temporalPallet?.boxes?.find(b => b.id === boxId);
        if (box && !isBoxAvailable(box)) {
            toast.error(`No se puede modificar el peso de la caja #${boxId}: está siendo usada en producción`, getToastTheme());
            return;
        }
        editPallet.box.edit.netWeight(boxId, netWeight);
    };

    const handleOnClickDuplicateBox = (boxId) => {
        if (isReadOnly) return;
        // Check if box is available before allowing duplicate
        const box = temporalPallet?.boxes?.find(b => b.id === boxId);
        if (box && !isBoxAvailable(box)) {
            toast.error(`No se puede duplicar la caja #${boxId}: está siendo usada en producción`, getToastTheme());
            return;
        }
        editPallet.box.duplicate(boxId);
    };

    const handleOnClickDeleteBox = (boxId) => {
        if (isReadOnly) return;
        // Check if box is available before allowing delete
        const box = temporalPallet?.boxes?.find(b => b.id === boxId);
        if (box && !isBoxAvailable(box)) {
            const productionInfo = getBoxProductionInfo(box);
            const productionText = productionInfo 
                ? ` (Producción #${productionInfo.id}${productionInfo.lot ? `, Lote: ${productionInfo.lot}` : ''})`
                : '';
            toast.error(`No se puede eliminar la caja #${boxId}: está siendo usada en producción${productionText}`, getToastTheme());
            return;
        }
        editPallet.box.delete(boxId);
    };

    const handleOnClickDeleteAllBoxes = () => {
        if (isReadOnly) return;
        deleteAllBoxes();
    };

    const handleOnClickReset = () => {
        if (isReadOnly) return;
        resetAllChanges();
    };

    const handleOnClickSaveChanges = () => {
        if (isReadOnly) return;
        // If onSaveTemporal is provided, use it instead of onSavingChanges
        if (onSaveTemporal && temporalPallet) {
            onSaveTemporal(temporalPallet);
        } else {
            onSavingChanges();
        }
    };

    /* const handleOnClickClose = () => {
        onCloseDialog();
        onClose();
    }; */

    /* click on back */
    const goBack = () => {
        window.history.back();
    };

    // Helper function to check if box is available
    const isBoxAvailable = (box) => {
        return box.isAvailable !== false;
    };

    // Helper function to get production information from box
    const getBoxProductionInfo = (box) => {
        // El campo production contiene { id, lot }
        return box.production || null;
    };

    // Agrupar cajas por producción
    const groupBoxesByProduction = () => {
        const productionGroups = new Map();
        const availableBoxes = [];

        temporalPallet.boxes.forEach(box => {
            if (isBoxAvailable(box)) {
                availableBoxes.push(box);
            } else {
                const productionInfo = getBoxProductionInfo(box);
                if (productionInfo) {
                    const productionKey = productionInfo.id || 'unknown';
                    if (!productionGroups.has(productionKey)) {
                        productionGroups.set(productionKey, {
                            production: productionInfo,
                            boxes: []
                        });
                    }
                    productionGroups.get(productionKey).boxes.push(box);
                } else {
                    // Si no tiene información de producción pero no está disponible, la agregamos a un grupo "sin producción"
                    const unknownKey = 'unknown';
                    if (!productionGroups.has(unknownKey)) {
                        productionGroups.set(unknownKey, {
                            production: { id: null, lot: null },
                            boxes: []
                        });
                    }
                    productionGroups.get(unknownKey).boxes.push(box);
                }
            }
        });

        return {
            available: availableBoxes,
            inProduction: Array.from(productionGroups.values())
        };
    };


    return (
        <>
            <div
                className={`
                ${!wrappedInDialog && "rounded-2xl border bg-card text-card-foreground shadow p-5 overflow-auto mb-4"}
                w-full h-full
                `}
            >
                {loading || !temporalPallet ? (
                    <div className="flex justify-center w-full flex-1 items-center h-full">
                        <Loader />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 h-full w-full">
                        <div className="flex items-center justify-center bg-red-100 rounded-full p-5 mb-2">
                            <CloudAlert className="w-12 h-12 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-destructive">¡Vaya! Ocurrió un error</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Por favor, revisa tu conexión o inténtalo nuevamente más tarde.
                        </p>
                        {!wrappedInDialog && (
                            <Button variant="outline" className="mt-4" onClick={goBack}>
                                Volver
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full ">
                        {!wrappedInDialog && (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg font-medium">
                                        {palletId && palletId !== 'new' ? `Editar Palet #${palletId}` : "Nuevo Palet"}
                                    </h1>
                                    {belongsToReception && receptionId && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={`/admin/raw-material-receptions/${receptionId}/edit`}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            <Package className="h-3 w-3" />
                                                            <span>Recepción #{receptionId}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Badge>
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Ver recepción #{receptionId}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        )}
                        {isReadOnly && (
                            <Alert className="mb-4 border-orange-200 bg-orange-50">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="flex items-center gap-2">
                                    <span className="text-orange-800">Este palet pertenece a una recepción. Puedes visualizar el contenido pero no editarlo.</span>
                                    {receptionId && (
                                        <Link 
                                            href={`/admin/raw-material-receptions/${receptionId}/edit`}
                                            className="text-orange-700 hover:text-orange-900 underline flex items-center gap-1 text-sm font-medium"
                                        >
                                            Ver recepción #{receptionId}
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="flex justify-center w-full">
                            <Tabs defaultValue="edicion" className="w-full">
                                <TabsList className="mx-auto mb-4">
                                    <TabsTrigger value="edicion" className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" /> Edición
                                    </TabsTrigger>
                                    <TabsTrigger value="acciones-masivas" className="flex items-center gap-2" disabled={isReadOnly}>
                                        <Layers className="h-4 w-4" /> Acciones Masivas
                                    </TabsTrigger>
                                    <TabsTrigger value="resumen" className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" /> Resumen
                                    </TabsTrigger>
                                    <TabsTrigger value="etiqueta" className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Etiqueta Palet
                                    </TabsTrigger>
                                    <TabsTrigger value="boxesLabels" className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Etiquetas Cajas
                                    </TabsTrigger>
                                    <TabsTrigger value="eliminar" className="flex items-center gap-2 bg-red-200 text-red-800 hover:bg-red-300" disabled={isReadOnly}>
                                        <Trash2 className="h-4 w-4" /> Eliminar
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="edicion" className="mt-0 ">
                                    <div className="grid grid-cols-5 gap-6 max-h-[calc(90vh-200px)]">
                                        <div className="space-y-6 overflow-y-auto pr-2 pb-2 col-span-2 max-h-[calc(90vh-200px)]">
                                            <Card className="border-2 border-muted bg-foreground-50 w-full">
                                                <CardHeader className="pb-4  w-full">
                                                    <CardTitle className="flex items-center justify-between gap-2 text-lg w-full">
                                                        <div className="flex items-center gap-2 ">
                                                            <Package className="h-5 w-5 text-primary" />
                                                            Agregar Cajas
                                                        </div>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <Tabs defaultValue="lector" className="w-full">
                                                        <TabsList className="grid w-full grid-cols-5"> {/* Cambiar de 6 a 5 columnas */}
                                                            <TabsTrigger value="lector" className="flex items-center gap-2">
                                                                <Scan className="h-4 w-4" /> Lector
                                                            </TabsTrigger>
                                                            <TabsTrigger value="manual" className="flex items-center gap-2">
                                                                <Plus className="h-4 w-4" /> Manual
                                                            </TabsTrigger>
                                                            <TabsTrigger value="masiva" className="flex items-center gap-2">
                                                                <Upload className="h-4 w-4" /> Masiva
                                                            </TabsTrigger>
                                                            <TabsTrigger value="promedio" className="flex items-center gap-2">
                                                                <Package className="h-4 w-4" /> Promedio
                                                            </TabsTrigger>
                                                            <TabsTrigger value="codes" className="flex items-center gap-2">
                                                                <Package className="h-4 w-4" /> Codigos GS1
                                                            </TabsTrigger>
                                                        </TabsList>
                                                        {/* IGNORAR */}

                                                        <TabsContent value="lector" className="space-y-3">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                                                                <Input
                                                                    value={boxCreationData.scannedCode}
                                                                    onChange={(e) => {
                                                                        boxCreationDataChange("scannedCode", e.target.value);
                                                                    }}
                                                                    type="text"
                                                                    autoFocus
                                                                    id="codigo-escaneado" placeholder="Escanea aquí..." className="font-mono"
                                                                    disabled={isReadOnly}
                                                                />
                                                                <p className="text-xs text-muted-foreground">
                                                                    La caja se agregará automáticamente al detectar un código válido
                                                                </p>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="codes" className="space-y-3">
                                                            <div className="space-y-4">
                                                                <Textarea
                                                                    value={boxCreationData.gs1codes}
                                                                    onChange={(e) => boxCreationDataChange("gs1codes", e.target.value)}
                                                                    placeholder="Ingresa los códigos GS1-128, uno por línea"
                                                                    className="min-h-[100px]"
                                                                    disabled={isReadOnly}
                                                                />
                                                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => boxCreationDataChange("gs1codes", "")}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" /> Resetear
                                                                    </Button>

                                                                    <Button className="w-full" onClick={() => onAddNewBox({ method: "gs1" })} disabled={isReadOnly}>
                                                                        <Upload className="h-4 w-4" /> Agregar Cajas en Lote
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="manual" className="">
                                                            <div className=" grid grid-cols-2 gap-4">
                                                                <div className="space-y-2 col-span-2">
                                                                    <Label>Artículo</Label>
                                                                    <Combobox
                                                                        options={productsOptions}
                                                                        placeholder='Seleccionar artículo'
                                                                        searchPlaceholder='Buscar artículo...'
                                                                        notFoundMessage='No se encontraron artículos'
                                                                        value={boxCreationData.productId}
                                                                        onChange={(value) => {
                                                                            boxCreationDataChange("productId", value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Lote</Label>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Lote del producto"
                                                                        value={boxCreationData.lot}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("lot", e.target.value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Peso Neto (kg)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={boxCreationData.netWeight}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("netWeight", e.target.value);
                                                                        }}
                                                                        className="text-right"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className=""
                                                                        onClick={() => {
                                                                            onResetBoxCreationData();
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" /> Resetear
                                                                    </Button>
                                                                    <Button className="w-full" onClick={() => onAddNewBox({ method: 'manual' })} disabled={isReadOnly}>
                                                                        <Plus className="h-4 w-4" /> Agregar Caja
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="masiva" className="space-y-4">
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label>Artículo</Label>
                                                                    <Combobox
                                                                        options={productsOptions}
                                                                        placeholder='Seleccionar artículo'
                                                                        searchPlaceholder='Buscar artículo...'
                                                                        notFoundMessage='No se encontraron artículos'
                                                                        value={boxCreationData.productId}
                                                                        onChange={(value) => {
                                                                            boxCreationDataChange("productId", value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Lote</Label>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Lote del producto"
                                                                        value={boxCreationData.lot}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("lot", e.target.value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <Textarea
                                                                    placeholder="Ingresa los pesos de las cajas, uno por línea"
                                                                    value={boxCreationData.weights}
                                                                    onChange={(e) => {
                                                                        const weights = e.target.value
                                                                        boxCreationDataChange("weights", weights);
                                                                    }}
                                                                    className="min-h-[100px]"
                                                                    disabled={isReadOnly}
                                                                />
                                                                <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className=""
                                                                        onClick={() => {
                                                                            onResetBoxCreationData();
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" /> Resetear
                                                                    </Button>
                                                                    <Button className="w-full" onClick={() => onAddNewBox({ method: 'bulk' })} disabled={isReadOnly}>
                                                                        <Upload className="h-4 w-4" /> Agregar Cajas en Lote
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        <TabsContent value="promedio" className="space-y-4">
                                                            <div className="space-y-4 grid grid-cols-3 gap-4">
                                                                <div className="space-y-2 col-span-3">
                                                                    <Label>Artículo</Label>
                                                                    <Combobox
                                                                        options={productsOptions}
                                                                        placeholder='Seleccionar artículo'
                                                                        searchPlaceholder='Buscar artículo...'
                                                                        notFoundMessage='No se encontraron artículos'
                                                                        value={boxCreationData.productId}
                                                                        onChange={(value) => {
                                                                            boxCreationDataChange("productId", value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2 ">
                                                                    <Label>Lote</Label>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Lote del producto"
                                                                        value={boxCreationData.lot}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("lot", e.target.value);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2 ">
                                                                    <Label>Peso Total (kg)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        value={boxCreationData.totalWeight}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("totalWeight", e.target.value);
                                                                        }}
                                                                        className="text-right"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2 ">
                                                                    <Label>Número de Cajas</Label>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        value={boxCreationData.numberOfBoxes}
                                                                        onChange={(e) => {
                                                                            boxCreationDataChange("numberOfBoxes", e.target.value);
                                                                        }}
                                                                        className="text-right"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                                <div className="space-y-3 col-span-3">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id="show-pallet-weight"
                                                                                checked={boxCreationData.showPalletWeight}
                                                                                onCheckedChange={(checked) => {
                                                                                    boxCreationDataChange("showPalletWeight", checked);
                                                                                    if (!checked) {
                                                                                        boxCreationDataChange("palletWeight", "");
                                                                                    }
                                                                                }}
                                                                                disabled={isReadOnly}
                                                                            />
                                                                            <Label
                                                                                htmlFor="show-pallet-weight"
                                                                                className="text-sm font-normal cursor-pointer"
                                                                            >
                                                                                Descontar peso del palet
                                                                            </Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id="show-box-tare"
                                                                                checked={boxCreationData.showBoxTare}
                                                                                onCheckedChange={(checked) => {
                                                                                    boxCreationDataChange("showBoxTare", checked);
                                                                                    if (!checked) {
                                                                                        boxCreationDataChange("boxTare", "");
                                                                                    }
                                                                                }}
                                                                                disabled={isReadOnly}
                                                                            />
                                                                            <Label
                                                                                htmlFor="show-box-tare"
                                                                                className="text-sm font-normal cursor-pointer"
                                                                            >
                                                                                Descontar tara de cajas
                                                                            </Label>
                                                                        </div>
                                                                    </div>
                                                                    {(boxCreationData.showPalletWeight || boxCreationData.showBoxTare) && (
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            {boxCreationData.showPalletWeight && (
                                                                                <div className="space-y-2">
                                                                                    <Label>Peso del Palet (kg)</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        placeholder="0.00"
                                                                                        value={boxCreationData.palletWeight}
                                                                                        onChange={(e) => {
                                                                                            boxCreationDataChange("palletWeight", e.target.value);
                                                                                        }}
                                                                                        className="text-right"
                                                                                        disabled={isReadOnly}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {boxCreationData.showBoxTare && (
                                                                                <div className="space-y-2">
                                                                                    <Label>Tara por Caja (kg)</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        placeholder="0.00"
                                                                                        value={boxCreationData.boxTare}
                                                                                        onChange={(e) => {
                                                                                            boxCreationDataChange("boxTare", e.target.value);
                                                                                        }}
                                                                                        className="text-right"
                                                                                        disabled={isReadOnly}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="col-span-3 grid grid-cols-2 gap-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        className=""
                                                                        onClick={() => {
                                                                            onResetBoxCreationData();
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" /> Resetear
                                                                    </Button>
                                                                    <Button className="w-full" onClick={() => onAddNewBox({ method: 'average' })} disabled={isReadOnly}>
                                                                        <Plus className="h-4 w-4" /> Generar Cajas
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </TabsContent>

                                                        
                                                    </Tabs>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-2 border-muted">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                        Información del Palet
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Observaciones</Label>
                                                        <Textarea
                                                            defaultValue={temporalPallet.observations || ""}
                                                            onChange={(e) => editPallet.observations(e.target.value)}
                                                            className="min-h-[80px]"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Pedido vinculado (opcional)</Label>
                                                        <Select disabled={orderIdBlocked} value={temporalPallet.orderId} onValueChange={(value) => editPallet.orderId(value)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sin pedido asignado" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {activeOrdersOptions?.map((order) => (
                                                                    <SelectItem key={order.id} value={order.id}>
                                                                        #{order.name} - {formatDateShort(order.load_date)}
                                                                    </SelectItem>
                                                                ))}
                                                                {temporalPallet.orderId &&
                                                                    !activeOrdersOptions?.some((order) => order.id === temporalPallet.orderId) && (
                                                                        <SelectItem value={temporalPallet.orderId}>
                                                                            #{temporalPallet.orderId} - Pedido Actual
                                                                        </SelectItem>
                                                                    )}
                                                            </SelectContent>
                                                        </Select>
                                                        {temporalPallet.orderId && !orderIdBlocked && !isReadOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={() => editPallet.orderId(null)}
                                                                className="text-xs text-destructive  hover:text-red-600 flex items-center gap-1"
                                                            >
                                                                <Link2Off className="inline h-4 w-4" />
                                                                Desvincular del pedido
                                                            </button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-4 overflow-y-auto col-span-3 flex flex-col">
                                            {(() => {
                                                const { available, inProduction } = groupBoxesByProduction();
                                                
                                                // Calcular datos resumen según el tab activo
                                                const getSummaryData = () => {
                                                    let boxesToShow = [];
                                                    
                                                    if (activeTab === "disponibles") {
                                                        boxesToShow = available;
                                                    } else if (activeTab === "produccion") {
                                                        boxesToShow = inProduction.flatMap(group => group.boxes);
                                                    } else {
                                                        boxesToShow = temporalPallet.boxes;
                                                    }
                                                    
                                                    const numberOfBoxes = boxesToShow.length;
                                                    const netWeight = boxesToShow.reduce((sum, box) => sum + parseFloat(box.netWeight || 0), 0);
                                                    
                                                    // Calcular productos únicos
                                                    const productsSet = new Set();
                                                    boxesToShow.forEach(box => {
                                                        if (box.product?.name) {
                                                            productsSet.add(box.product.name);
                                                        }
                                                    });
                                                    const totalProducts = productsSet.size;
                                                    
                                                    // Calcular lotes únicos
                                                    const lotsSet = new Set();
                                                    boxesToShow.forEach(box => {
                                                        if (box.lot) {
                                                            lotsSet.add(box.lot);
                                                        }
                                                    });
                                                    const totalLots = lotsSet.size;
                                                    
                                                    return {
                                                        numberOfBoxes,
                                                        netWeight,
                                                        totalProducts,
                                                        totalLots
                                                    };
                                                };
                                                
                                                const summaryData = getSummaryData();
                                                
                                                // Función para renderizar una fila de caja (reutilizable)
                                                const renderBoxRow = (box, isEditable = true) => {
                                                    const isSelected = box.id === selectedBox;
                                                    const boxAvailable = isBoxAvailable(box);
                                                    const canEditBox = isEditable && !isReadOnly && boxAvailable;
                                                    
                                                    if (isSelected && canEditBox) {
                                                        return (
                                                            <TableRow key={box.id} onClick={() => handleOnClickBoxRow(box.id)} className="hover:bg-muted">
                                                                <TableCell>{box.product.name}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        defaultValue={box.lot}
                                                                        onChange={(e) => {
                                                                            handleOnChangeBoxLot(box.id, e.target.value);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full"
                                                                        disabled={isReadOnly || !boxAvailable}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{box.gs1128}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        defaultValue={box.netWeight}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onChange={(e) => {
                                                                            handleOnChangeBoxNetWeight(box.id, parseFloat(e.target.value));
                                                                        }}
                                                                        className="w-full "
                                                                        disabled={isReadOnly || !boxAvailable}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    {canEditBox && (
                                                                        <div className="flex gap-1">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleOnClickDuplicateBox(box.id)
                                                                                }}
                                                                                disabled={isReadOnly || !boxAvailable}
                                                                            >
                                                                                <Copy className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-destructive"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleOnClickDeleteBox(box.id);
                                                                                }}
                                                                                disabled={isReadOnly || !boxAvailable}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <TableRow 
                                                            key={box.id} 
                                                            onClick={canEditBox ? () => handleOnClickBoxRow(box.id) : undefined}
                                                            className={`${canEditBox ? 'cursor-text hover:bg-muted' : 'cursor-default'} ${box?.new === true ? "bg-foreground-50" : ""} ${!boxAvailable ? "bg-orange-50/30" : ""}`}
                                                        >
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {box.product.name}
                                                                    {!boxAvailable && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>
                                                                                        {(() => {
                                                                                            const productionInfo = getBoxProductionInfo(box);
                                                                                            return productionInfo 
                                                                                                ? `Caja usada en producción #${productionInfo.id}${productionInfo.lot ? ` (Lote: ${productionInfo.lot})` : ''}`
                                                                                                : 'Caja usada en producción';
                                                                                        })()}
                                                                                    </p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{box.lot}</TableCell>
                                                            <TableCell>{box.gs1128}</TableCell>
                                                            <TableCell>{box.netWeight} kg</TableCell>
                                                            <TableCell>
                                                                {canEditBox && (
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOnClickDuplicateBox(box.id)
                                                                            }}
                                                                        >
                                                                            <Copy className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOnClickDeleteBox(box.id);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                {!boxAvailable && (
                                                                    <span className="text-xs text-muted-foreground">🔒 No editable</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                };
                                                
                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between flex-shrink-0">
                                                            <h3 className="text-lg font-semibold">Cajas en el Palet</h3>
                                                            <div className="text-sm text-muted-foreground/90 bg-foreground-50 rounded-full px-4 py-1  flex items-center">
                                                                <span>{summaryData.numberOfBoxes} cajas</span>
                                                                <Separator orientation="vertical" className="mx-2 h-3" />
                                                                <span>{formatDecimalWeight(summaryData.netWeight)}</span>
                                                                <Separator orientation="vertical" className="mx-2 h-3" />
                                                                <span>{summaryData.totalProducts} productos</span>
                                                                <Separator orientation="vertical" className="mx-2 h-3" />
                                                                <span>{summaryData.totalLots} lotes</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                                                        <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                                                            <TabsTrigger value="disponibles" className="flex items-center gap-2">
                                                                <CheckCircle className="h-4 w-4" />
                                                                Disponibles ({available.length})
                                                            </TabsTrigger>
                                                            <TabsTrigger value="produccion" className="flex items-center gap-2">
                                                                <Factory className="h-4 w-4" />
                                                                En Producción ({inProduction.reduce((sum, group) => sum + group.boxes.length, 0)})
                                                            </TabsTrigger>
                                                            <TabsTrigger value="todas">
                                                                Todas ({temporalPallet.boxes.length})
                                                            </TabsTrigger>
                                                        </TabsList>
                                                        
                                                        {/* Tab: Todas las cajas */}
                                                        <TabsContent value="todas" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
                                                            <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                                <div className="overflow-y-auto flex-1 max-h-[calc(90vh-300px)]">
                                                                    <Table>
                                                                        <TableHeader className="sticky top-0 bg-background z-10">
                                                                            <TableRow>
                                                                                <TableHead className="min-w-[200px]">Artículo</TableHead>
                                                                                <TableHead className="min-w-[170px] w-[170px]">Lote</TableHead>
                                                                                <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                                                                <TableHead className="min-w-[100px] w-[100px]">Peso Neto</TableHead>
                                                                                <TableHead className="min-w-[150px]">Estado</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {temporalPallet.boxes.length === 0 ? (
                                                                                <TableRow>
                                                                                    <TableCell colSpan={5} className="p-0">
                                                                                        <div className="py-12">
                                                                                            <EmptyState
                                                                                                icon={<Box className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                                                title="No hay cajas en el palet"
                                                                                                description="Agrega cajas al palet usando las opciones de la izquierda"
                                                                                            />
                                                                                        </div>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ) : (
                                                                                temporalPallet.boxes.map((box) => {
                                                                                    const boxAvailable = isBoxAvailable(box);
                                                                                    const productionInfo = getBoxProductionInfo(box);
                                                                                    
                                                                                    return (
                                                                                        <TableRow 
                                                                                            key={box.id}
                                                                                            className={`cursor-default ${box?.new === true ? "bg-foreground-50" : ""} ${!boxAvailable ? "bg-orange-50/50" : ""}`}
                                                                                        >
                                                                                            <TableCell>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    {box.product.name}
                                                                                                    {!boxAvailable && (
                                                                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell>{box.lot}</TableCell>
                                                                                            <TableCell>{box.gs1128}</TableCell>
                                                                                            <TableCell>{box.netWeight} kg</TableCell>
                                                                                            <TableCell>
                                                                                                {!boxAvailable && productionInfo ? (
                                                                                                    <TooltipProvider>
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 border border-orange-200 cursor-help hover:bg-orange-200 transition-colors">
                                                                                                                    <Factory className="h-3.5 w-3.5" />
                                                                                                                </div>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent>
                                                                                                                <div className="space-y-1">
                                                                                                                    <p className="font-semibold">En Producción</p>
                                                                                                                    <p className="text-xs">Producción #{productionInfo.id || 'N/A'}</p>
                                                                                                                    {productionInfo.lot && (
                                                                                                                        <p className="text-xs">Lote: {productionInfo.lot}</p>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </TooltipProvider>
                                                                                                ) : (
                                                                                                    <TooltipProvider>
                                                                                                        <Tooltip>
                                                                                                            <TooltipTrigger asChild>
                                                                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 border border-green-200 cursor-help hover:bg-green-200 transition-colors">
                                                                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                                                                </div>
                                                                                                            </TooltipTrigger>
                                                                                                            <TooltipContent>
                                                                                                                <p className="font-semibold">Disponible</p>
                                                                                                            </TooltipContent>
                                                                                                        </Tooltip>
                                                                                                    </TooltipProvider>
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </TabsContent>
                                                        
                                                        {/* Tab: Cajas disponibles */}
                                                        <TabsContent value="disponibles" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
                                                            {available.length > 0 ? (
                                                                <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                                    <div className="overflow-y-auto flex-1 max-h-[calc(90vh-300px)]"> 
                                                                        <Table>
                                                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                                                <TableRow>
                                                                                    <TableHead className="min-w-[200px]">Artículo</TableHead>
                                                                                    <TableHead className="min-w-[170px] w-[170px]">Lote</TableHead>
                                                                                    <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                                                                    <TableHead className="min-w-[100px] w-[100px]">Peso Neto</TableHead>
                                                                                    <TableHead className="w-[100px]">Acciones</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {available.map((box) => renderBoxRow(box, true))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <EmptyState
                                                                            icon={<CheckCircle className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                            title="No hay cajas disponibles"
                                                                            description="Todas las cajas de este palet están en producción"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                        
                                                        {/* Tab: Cajas en producción */}
                                                        <TabsContent value="produccion" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden">
                                                            {inProduction.length > 0 ? (
                                                                <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                                    <div className="overflow-y-auto flex-1 max-h-[calc(90vh-300px)]">
                                                                        <Table>
                                                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                                                <TableRow>
                                                                                    <TableHead className="min-w-[200px]">Artículo</TableHead>
                                                                                    <TableHead className="min-w-[170px] w-[170px]">Lote</TableHead>
                                                                                    <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                                                                    <TableHead className="min-w-[100px] w-[100px]">Peso Neto</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {inProduction.map((group, groupIndex) => (
                                                                                    <React.Fragment key={group.production.id || `unknown-${groupIndex}`}>
                                                                                        {/* Fila de encabezado del grupo */}
                                                                                        {(() => {
                                                                                            const totalWeight = group.boxes.reduce((sum, box) => sum + parseFloat(box.netWeight || 0), 0);
                                                                                            return (
                                                                                                <TableRow className="bg-orange-50/50 hover:bg-orange-50">
                                                                                                    <TableCell colSpan={4} className="py-2">
                                                                                                        <div className="flex items-center gap-2 font-semibold text-orange-900">
                                                                                                            <Factory className="h-4 w-4" />
                                                                                                            <span>Producción #{group.production.id || 'N/A'}</span>
                                                                                                            {group.production.lot && (
                                                                                                                <>
                                                                                                                    <Separator orientation="vertical" className="h-4" />
                                                                                                                    <span className="text-sm font-normal text-orange-700">Lote: {group.production.lot}</span>
                                                                                                                </>
                                                                                                            )}
                                                                                                            <Separator orientation="vertical" className="h-4" />
                                                                                                            <span className="text-sm font-normal text-orange-700">{group.boxes.length} {group.boxes.length === 1 ? 'caja' : 'cajas'}</span>
                                                                                                            <Separator orientation="vertical" className="h-4" />
                                                                                                            <span className="text-sm font-normal text-orange-700">{formatDecimalWeight(totalWeight)}</span>
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            );
                                                                                        })()}
                                                                                        {/* Filas de cajas del grupo - NO EDITABLES */}
                                                                                        {group.boxes.map((box) => {
                                                                                            return (
                                                                                                <TableRow 
                                                                                                    key={box.id}
                                                                                                    className={`cursor-default bg-orange-50/30 ${box?.new === true ? "bg-foreground-50" : ""}`}
                                                                                                >
                                                                                                    <TableCell>
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            {box.product.name}
                                                                                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                                        </div>
                                                                                                    </TableCell>
                                                                                                    <TableCell>{box.lot}</TableCell>
                                                                                                    <TableCell>{box.gs1128}</TableCell>
                                                                                                    <TableCell>{box.netWeight} kg</TableCell>
                                                                                                </TableRow>
                                                                                            );
                                                                                        })}
                                                                                    </React.Fragment>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                                    <div className="flex items-center justify-center h-full">
                                                                        <EmptyState
                                                                            icon={<Factory className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                            title="No hay cajas en producción"
                                                                            description="Todas las cajas de este palet están disponibles"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                    </Tabs>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="acciones-masivas" className="mt-0">
                                    <div className="grid grid-cols-5 gap-6 max-h-[calc(90vh-200px)]">
                                        <div className="space-y-6 overflow-y-auto pr-2 pb-2 col-span-2 max-h-[calc(90vh-200px)]">
                                            <Card className="border-2 border-muted bg-foreground-50 w-full">
                                                <CardHeader className="pb-4 w-full">
                                                    <CardTitle className="flex items-center gap-2 text-lg w-full">
                                                        <Layers className="h-5 w-5 text-primary" />
                                                        Acciones Masivas
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Selecciona la acción a realizar</Label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <Button
                                                                variant={bulkActionType === 'lot' ? 'default' : 'outline'}
                                                                onClick={() => {
                                                                    setBulkActionType('lot');
                                                                    setBulkActionValue('');
                                                                }}
                                                                className="h-auto py-3 flex flex-col items-center gap-2"
                                                                disabled={isReadOnly}
                                                            >
                                                                <FileText className="h-5 w-5" />
                                                                <span>Cambiar Lote</span>
                                                            </Button>
                                                            <Button
                                                                variant={bulkActionType === 'weight' ? 'default' : 'outline'}
                                                                onClick={() => {
                                                                    setBulkActionType('weight');
                                                                    setBulkActionValue('');
                                                                }}
                                                                className="h-auto py-3 flex flex-col items-center gap-2"
                                                                disabled={isReadOnly}
                                                            >
                                                                <Weight className="h-5 w-5" />
                                                                <span>Cambiar Peso</span>
                                                            </Button>
                                                            <Button
                                                                variant={bulkActionType === 'weightAdd' ? 'default' : 'outline'}
                                                                onClick={() => {
                                                                    setBulkActionType('weightAdd');
                                                                    setBulkActionValue('');
                                                                    setWeightOperation('add');
                                                                }}
                                                                className="h-auto py-3 flex flex-col items-center gap-2"
                                                                disabled={isReadOnly}
                                                            >
                                                                <Plus className="h-5 w-5" />
                                                                <span>Sumar/Restar Peso</span>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {bulkActionType && (
                                                        <>
                                                            {bulkActionType === 'weightAdd' && (
                                                                <div className="space-y-2">
                                                                    <Label>Operación</Label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <Button
                                                                            variant={weightOperation === 'add' ? 'default' : 'outline'}
                                                                            onClick={() => setWeightOperation('add')}
                                                                            className="h-auto py-2 flex items-center justify-center gap-2"
                                                                            disabled={isReadOnly}
                                                                            type="button"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                            <span>Sumar</span>
                                                                        </Button>
                                                                        <Button
                                                                            variant={weightOperation === 'subtract' ? 'default' : 'outline'}
                                                                            onClick={() => setWeightOperation('subtract')}
                                                                            className="h-auto py-2 flex items-center justify-center gap-2"
                                                                            disabled={isReadOnly}
                                                                            type="button"
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                            <span>Restar</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="space-y-2">
                                                                <Label>
                                                                    {bulkActionType === 'lot' 
                                                                        ? 'Nuevo Lote' 
                                                                        : bulkActionType === 'weight'
                                                                        ? 'Nuevo Peso Neto (kg)'
                                                                        : 'Peso a ' + (weightOperation === 'add' ? 'sumar' : 'restar') + ' (kg)'}
                                                                </Label>
                                                                {bulkActionType === 'lot' ? (
                                                                    <Input
                                                                        value={bulkActionValue}
                                                                        onChange={(e) => setBulkActionValue(e.target.value)}
                                                                        placeholder="Ingresa el nuevo lote"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                ) : (
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={bulkActionValue}
                                                                        onChange={(e) => setBulkActionValue(e.target.value)}
                                                                        placeholder="0.00"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                )}
                                                            </div>

                                                            <Alert className="border-blue-200 bg-blue-50">
                                                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                                                <AlertDescription className="text-blue-800 text-sm">
                                                                    Los cambios se aplicarán únicamente a las cajas disponibles (no en producción).
                                                                </AlertDescription>
                                                            </Alert>

                                                            <div className="pt-2">
                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => {
                                                                        if (!bulkActionValue || bulkActionValue.trim() === '') {
                                                                            return;
                                                                        }

                                                                        if (bulkActionType === 'lot') {
                                                                            editPallet.box.bulkEdit.changeLot(
                                                                                null,
                                                                                bulkActionValue.trim()
                                                                            );
                                                                        } else if (bulkActionType === 'weight') {
                                                                            editPallet.box.bulkEdit.changeNetWeight(
                                                                                null,
                                                                                parseFloat(bulkActionValue)
                                                                            );
                                                                        } else if (bulkActionType === 'weightAdd') {
                                                                            const weightValue = parseFloat(bulkActionValue);
                                                                            const weightDifference = weightOperation === 'add' ? weightValue : -weightValue;
                                                                            editPallet.box.bulkEdit.addOrSubtractWeight(
                                                                                null,
                                                                                weightDifference
                                                                            );
                                                                        }

                                                                        setBulkActionType(null);
                                                                        setBulkActionValue('');
                                                                        setWeightOperation('add');
                                                                    }}
                                                                    disabled={!bulkActionValue || bulkActionValue.trim() === '' || isReadOnly}
                                                                >
                                                                    Aplicar Cambios
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {isReadOnly && (
                                                        <Alert className="border-orange-200 bg-orange-50">
                                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                                            <AlertDescription className="text-orange-800">
                                                                Este palet pertenece a una recepción. Las acciones masivas no están disponibles.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            <Card className="border-2 border-muted">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                                        Información
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                                    <p>
                                                        Las acciones masivas te permiten modificar múltiples cajas del palet de una sola vez.
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                                        <li><strong>Cambiar Lote:</strong> Aplica un nuevo lote a todas las cajas disponibles</li>
                                                        <li><strong>Cambiar Peso:</strong> Aplica un nuevo peso neto a todas las cajas disponibles</li>
                                                        <li><strong>Sumar/Restar Peso:</strong> Suma o resta un valor de peso a todas las cajas disponibles</li>
                                                        <li><strong>Importante:</strong> Los cambios solo se aplican a cajas disponibles (no en producción). Las cajas en producción no pueden ser modificadas.</li>
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-4 overflow-y-auto col-span-3 flex flex-col">
                                            <div className="flex items-center justify-between flex-shrink-0">
                                                <h3 className="text-lg font-semibold">Vista Previa de Cajas</h3>
                                                <div className="text-sm text-muted-foreground/90 bg-foreground-50 rounded-full px-4 py-1 flex items-center">
                                                    <span>{temporalPallet.boxes.length} cajas</span>
                                                    <Separator orientation="vertical" className="mx-2 h-3" />
                                                    <span>{formatDecimalWeight(temporalPallet.netWeight)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="border rounded-lg overflow-hidden h-full flex flex-col">
                                                <div className="overflow-y-auto flex-1 max-h-[calc(90vh-300px)]">
                                                    <Table>
                                                        <TableHeader className="sticky top-0 bg-background z-10">
                                                            <TableRow>
                                                                <TableHead className="min-w-[200px]">Artículo</TableHead>
                                                                <TableHead className="min-w-[170px] w-[170px]">Lote</TableHead>
                                                                <TableHead className="min-w-[150px]">GS1 128</TableHead>
                                                                <TableHead className="min-w-[100px] w-[100px]">Peso Neto</TableHead>
                                                                <TableHead className="min-w-[150px]">Estado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {temporalPallet.boxes.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="p-0">
                                                                        <div className="py-12">
                                                                            <EmptyState
                                                                                icon={<Box className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                                                                                title="No hay cajas en el palet"
                                                                                description="Agrega cajas al palet usando la pestaña de Edición"
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                temporalPallet.boxes.map((box) => {
                                                                    const boxAvailable = isBoxAvailable(box);
                                                                    const productionInfo = getBoxProductionInfo(box);
                                                                    
                                                                    return (
                                                                        <TableRow 
                                                                            key={box.id}
                                                                            className={`cursor-default ${box?.new === true ? "bg-foreground-50" : ""} ${!boxAvailable ? "bg-orange-50/50" : ""}`}
                                                                        >
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-2">
                                                                                    {box.product.name}
                                                                                    {!boxAvailable && (
                                                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>{box.lot}</TableCell>
                                                                            <TableCell>{box.gs1128}</TableCell>
                                                                            <TableCell>{box.netWeight} kg</TableCell>
                                                                            <TableCell>
                                                                                {!boxAvailable && productionInfo ? (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 border border-orange-200 cursor-help hover:bg-orange-200 transition-colors">
                                                                                                    <Factory className="h-3.5 w-3.5" />
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>
                                                                                                <div className="space-y-1">
                                                                                                    <p className="font-semibold">En Producción</p>
                                                                                                    <p className="text-xs">Producción #{productionInfo.id || 'N/A'}</p>
                                                                                                    {productionInfo.lot && (
                                                                                                        <p className="text-xs">Lote: {productionInfo.lot}</p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                ) : (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 border border-green-200 cursor-help hover:bg-green-200 transition-colors">
                                                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>
                                                                                                <p className="font-semibold">Disponible</p>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="resumen" className="mt-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-200px)] overflow-y-auto px-2">

                                        <div className="flex flex-col gap-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-xl">Resumen General del Palet</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className=" p-2 border rounded-lg bg-foreground-50 flex items-center gap-2">
                                                            <div className="p-2.5 rounded-lg bg-foreground-200/50">
                                                                <Box className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="text-lg font-medium">{temporalPallet.numberOfBoxes}</h4>
                                                                <span className="text-sm text-muted-foreground">Cajas</span>
                                                            </div>
                                                        </div>

                                                        <div className=" p-2 border rounded-lg bg-foreground-50 flex items-center gap-2">
                                                            <div className="p-2.5 rounded-lg bg-foreground-200/50">
                                                                <PiShrimp className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="text-lg font-medium">{temporalTotalProducts}</h4>
                                                                <span className="text-sm text-muted-foreground">Productos</span>
                                                            </div>
                                                        </div>

                                                        <div className=" p-2 border rounded-lg bg-foreground-50 flex items-center gap-2">
                                                            <div className="p-2.5 rounded-lg bg-foreground-200/50">
                                                                <Layers className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="text-lg font-medium">{temporalTotalLots}</h4>
                                                                <span className="text-sm text-muted-foreground">Lotes</span>
                                                            </div>
                                                        </div>

                                                        <div className=" p-2 border rounded-lg bg-foreground-50 flex items-center gap-2">
                                                            <div className="p-2.5 rounded-lg bg-foreground-200/50">
                                                                <Weight className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h4 className="text-lg font-medium">{formatDecimalWeight(temporalPallet.netWeight)}</h4>
                                                                <span className="text-sm text-muted-foreground">Peso total</span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Espacio para gráficos */}
                                            <Card className="flex-1">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Gráfico de Distribución</CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-[240px] flex items-center justify-center">
                                                    <SummaryPieChart data={getPieChartData} />
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Columna izquierda: Productos + detalles por lote */}
                                        <div className="space-y-4 h-full overflow-y-auto">
                                            {temporalProductsSummary &&
                                                Object.entries(temporalProductsSummary).map(([productName, productData]) => (
                                                    <Card key={productName}>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-lg flex justify-between items-center">
                                                                {productName}
                                                                <Badge variant="outline" className="text-sm font-medium">
                                                                    {productData.numberOfBoxes} cajas •  {productData.totalNetWeight.toFixed(2)} kg
                                                                </Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Collapsible>
                                                                <CollapsibleTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="w-full justify-between">
                                                                        Ver detalles por lote
                                                                        <span className="ml-2 text-muted-foreground">
                                                                            <ChevronDown className="h-4 w-4 transition-transform duration-200 transform" />
                                                                        </span>
                                                                    </Button>
                                                                </CollapsibleTrigger>

                                                                <CollapsibleContent className="space-y-3 mt-4">
                                                                    {Object.entries(productData.lots).map(([lot, weights]) => (
                                                                        <div key={lot} className="p-3 border rounded-lg bg-muted/50">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="font-medium">Lote: {lot}</span>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {weights.length} cajas
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="space-y-1 text-sm">
                                                                                {weights.map((weight, index) => (
                                                                                    <div key={index} className="flex justify-between">
                                                                                        <span>Caja {index + 1}:</span>
                                                                                        <span>{weight.toFixed(2)} kg</span>
                                                                                    </div>
                                                                                ))}
                                                                                <Separator />
                                                                                <div className="flex justify-between font-medium mt-1">
                                                                                    <span>Subtotal:</span>
                                                                                    <span>{weights.reduce((sum, w) => sum + w, 0).toFixed(2)} kg</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        </CardContent>

                                                    </Card>
                                                ))}
                                        </div>

                                    </div>
                                </TabsContent>

                                <TabsContent value="etiqueta" className="mt-0">
                                    <div className="flex flex-col items-center gap-4 mt-4  ">
                                        <div className='bg-orange-200 px-4'>
                                            <div className="flex flex-col items-center  gap-4"
                                                style={{ width: PALLET_LABEL_SIZE.width }}>
                                                <div className="w-full h-20 bg-white rounded-b-xl border-t-0 border bg-card text-card-foreground  shadow">
                                                </div>
                                                <div id='print-area-id' className=" text-black"
                                                    style={{ width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height }}>
                                                    <PalletLabel pallet={temporalPallet} />
                                                </div>
                                                <div className="w-full h-20 bg-white rounded-t-xl  border border-b-0 bg-card text-card-foreground  ">

                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={handleOnClickPrintLabel}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Imprimir Etiqueta
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="boxesLabels" className="mt-0 w-full">
                                    <BoxesLabels pallet={temporalPallet} setBoxPrinted={setBoxPrinted} />
                                </TabsContent>

                                <TabsContent value="eliminar" className="mt-0 ">
                                    <div className="grid grid-cols-5 gap-6 max-h-[calc(90vh-200px)]">
                                        {/* Columna izquierda: opciones de eliminación */}
                                        <div className="space-y-6 overflow-y-auto pr-2 col-span-2 ">
                                            <Card className="border-2 border-muted bg-foreground-50 w-full">
                                                <CardHeader className="pb-4 w-full">
                                                    <CardTitle className="flex items-center gap-2 text-lg w-full">
                                                        <Trash2 className="h-5 w-5 text-destructive" /> Eliminar cajas
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                                                                <Input
                                                                    value={boxCreationData.deleteScannedCode}
                                                                    onChange={(e) => {
                                                                        boxCreationDataChange("deleteScannedCode", e.target.value);
                                                                    }}
                                                                    type="text"
                                                                    id="codigo-escaneado"
                                                                    placeholder="Escanea aquí..."
                                                                    className="font-mono"
                                                                    disabled={isReadOnly}
                                                                />
                                                        <p className="text-xs text-muted-foreground">
                                                            La caja se eliminará automáticamente al detectar un código válido
                                                        </p>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button variant='destructive' className="w-full" onClick={() => handleOnClickDeleteAllBoxes()} disabled={isReadOnly}>
                                                            <Trash2 className="h-4 w-4 " /> Eliminar todas las cajas
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-4 overflow-y-auto col-span-3 ">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">Cajas en el Palet</h3>
                                                <div className="text-sm text-muted-foreground/90 bg-foreground-50 rounded-full px-4 py-1  flex items-center">
                                                    <span>{temporalPallet.numberOfBoxes} cajas</span>
                                                    <Separator orientation="vertical" className="mx-2 h-3" />
                                                    <span>{formatDecimalWeight(temporalPallet.netWeight)}</span>
                                                    <Separator orientation="vertical" className="mx-2 h-3" />
                                                    <span>{temporalTotalProducts} productos</span>
                                                    <Separator orientation="vertical" className="mx-2 h-3" />
                                                    <span>{temporalTotalLots} lotes</span>
                                                </div>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="overflow-y-auto max-h-[calc(90vh-260px)]">
                                                    <Table>
                                                        <TableHeader className="sticky top-0 bg-background">
                                                            <TableRow>
                                                                <TableHead>Artículo</TableHead>
                                                                <TableHead>Lote</TableHead>
                                                                <TableHead>GS1 128</TableHead>
                                                                <TableHead>Peso Neto</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                                <TableHead className="w-[100px]">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {temporalPallet.boxes.map((box) => {
                                                                const boxAvailable = isBoxAvailable(box);
                                                                const productionInfo = getBoxProductionInfo(box);
                                                                
                                                                return (
                                                                    <TableRow key={box.id} onClick={() => handleOnClickBoxRow(box.id)}
                                                                        className={`cursor-text hover:bg-muted ${box?.new === true ? "bg-foreground-50" : ""} ${!boxAvailable ? "bg-orange-50/50" : ""}`}
                                                                    >
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                {box.product.name}
                                                                                {!boxAvailable && (
                                                                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>{box.lot}</TableCell>
                                                                        <TableCell>{box.gs1128}</TableCell>
                                                                        <TableCell>{box.netWeight} kg</TableCell>
                                                                        <TableCell>
                                                                            {!boxAvailable && productionInfo ? (
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 cursor-help">
                                                                                                <Factory className="h-3 w-3 mr-1" />
                                                                                                En Producción
                                                                                            </Badge>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>
                                                                                            <div className="space-y-1">
                                                                                                <p className="font-semibold">Producción #{productionInfo.id || 'N/A'}</p>
                                                                                                {productionInfo.lot && (
                                                                                                    <p className="text-xs">Lote: {productionInfo.lot}</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            ) : (
                                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                    Disponible
                                                                                </Badge>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOnClickDuplicateBox(box.id)
                                                                                    }}
                                                                                    disabled={!boxAvailable || isReadOnly}
                                                                                    title={isReadOnly ? "Este pallet pertenece a una recepción y no puede ser editado" : (!boxAvailable ? "No se puede duplicar una caja en producción" : "Duplicar caja")}
                                                                                >
                                                                                    <Copy className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-destructive"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOnClickDeleteBox(box.id);
                                                                                    }}
                                                                                    disabled={!boxAvailable || isReadOnly}
                                                                                    title={isReadOnly ? "Este pallet pertenece a una recepción y no puede ser editado" : (!boxAvailable ? "No se puede eliminar una caja en producción" : "Eliminar caja")}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                            </Tabs>
                        </div>
                                                        <div className="flex justify-end gap-3 pt-4 pb-6 border-t mt-4 mb-4">
                            <Button variant="outline" onClick={handleOnClickReset} disabled={saving || isReadOnly}>
                                Deshacer
                            </Button>
                            <Button onClick={handleOnClickSaveChanges} disabled={saving || isReadOnly}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
