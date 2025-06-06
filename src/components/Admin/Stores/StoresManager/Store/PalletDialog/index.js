"use client";

import { Copy, Trash2, Scan, Plus, Upload, Package, FileText, Edit, Eye, CloudAlert, RotateCcw, ChevronDown, Box, Truck, Layers, Weight, Link2Off, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useStoreContext } from "@/context/StoreContext";
import { usePallet } from "@/hooks/usePallet";
import Loader from "@/components/Utilities/Loader";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { formatDateShort } from "@/helpers/formats/dates/formatDates";
import { useRef, useState } from "react";
import { Combobox } from "@/components/Shadcn/Combobox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PiShrimp } from "react-icons/pi";
import SummaryPieChart from "./SummaryPieChart";
import { PALLET_LABEL_SIZE } from "@/configs/config";
import { createPortal } from "react-dom";
/* import { useReactToPrint } from "react-to-print"; */
import PalletLabel from "../PositionSlideover/PalletCard/PalletLabel";
import { Test } from "../PositionSlideover/PalletCard";
import printJS from "print-js";


export default function PalletDialog({ palletId, isOpen, onChange, initialStoreId = null, initialOrderId = null }) {
    const { closePalletDialog } = useStoreContext();
    const {
        productsOptions,
        boxCreationData,
        boxCreationDataChange,
        loading,
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
    } = usePallet({ id: palletId, onChange, initialStoreId, initialOrderId });


    /*  const handlePrint = useReactToPrint({
         content: () => printRef.current,
         documentTitle: `Etiqueta Palet ${temporalPallet?.id}`,
         pageStyle: `
       @page {
         size: ${PALLET_LABEL_SIZE.width} ${PALLET_LABEL_SIZE.height};
         margin: 0;
       }
       body {
         margin: 0;
         background: white;
       }
     `,
     }); */

    const handlePrint = () => {
        printJS({ printable: 'print-area-id', type: 'html', targetStyles: ['*'] });
    };


    const [selectedBox, setSelectedBox] = useState(null);

    /* Handles */

    const handleOnClickBoxRow = (boxId) => {
        if (selectedBox === boxId) {
            setSelectedBox(null);
        } else {
            setSelectedBox(boxId);
        }
    };

    const handleOnChangeBoxLot = (boxId, lot) => {
        editPallet.box.edit.lot(boxId, lot);
    };
    const handleOnChangeBoxNetWeight = (boxId, netWeight) => {
        editPallet.box.edit.netWeight(boxId, netWeight);
    };

    const handleOnClickDuplicateBox = (boxId) => {
        editPallet.box.duplicate(boxId);
    };

    const handleOnClickDeleteBox = (boxId) => {
        editPallet.box.delete(boxId);
    };

    const handleOnClickDeleteAllBoxes = () => {
        deleteAllBoxes();
    };

    const handleOnClickReset = () => {
        resetAllChanges();
    };

    const handleOnClickSaveChanges = () => {
        onSavingChanges();
    };

    const handleOnClickClose = () => {
        closePalletDialog();
        onClose();
    };


    return (
        <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
            {loading || !temporalPallet ? (
                <DialogContent className="w-full min-h-[40vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="sr-only">
                            Editar Palet
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center w-full flex-1 items-center">
                        <Loader />
                    </div>
                </DialogContent>
            ) : error ? (
                <DialogContent className="w-full  flex flex-col items-center justify-center gap-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 py-10">
                        <div className="flex items-center justify-center bg-red-100 rounded-full p-5 mb-2">
                            <CloudAlert className="w-12 h-12 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold text-destructive">¡Vaya! Ocurrió un error</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Por favor, revisa tu conexión o inténtalo nuevamente más tarde.
                        </p>
                        <Button variant="destructive" className="px-20 mt-5" onClick={closePalletDialog}>
                            Cerrar
                        </Button>
                    </div>
                </DialogContent>

            ) : (
                <DialogContent className="w-full max-w-[95vw] max-h-[90vw] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="">
                            {temporalPallet?.id ? `Editar Palet #${temporalPallet.id}` : "Nuevo Palet"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex justify-center w-full">
                        <Tabs defaultValue="edicion" className="w-full">
                            <TabsList className="mx-auto mb-4">
                                <TabsTrigger value="edicion" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" /> Edición
                                </TabsTrigger>
                                <TabsTrigger value="resumen" className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Resumen
                                </TabsTrigger>
                                <TabsTrigger value="etiqueta" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Etiqueta
                                </TabsTrigger>

                            </TabsList>

                            <TabsContent value="edicion" className="mt-0">
                                <div className="grid grid-cols-5 gap-6 h-[calc(90vh-180px)]">
                                    <div className="space-y-6 overflow-y-auto pr-2 col-span-2">
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
                                                    <TabsList className="grid w-full grid-cols-5">
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
                                                        <TabsTrigger value="eliminar" className="flex items-center gap-2 bg-red-200 text-red-800 hover:bg-red-300">
                                                            <Trash2 className="h-4 w-4" /> Eliminar
                                                        </TabsTrigger>
                                                    </TabsList>

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
                                                                id="codigo-escaneado" placeholder="Escanea aquí..." className="font-mono" />
                                                            <p className="text-xs text-muted-foreground">
                                                                La caja se agregará automáticamente al detectar un código válido
                                                            </p>
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
                                                                />
                                                            </div>
                                                            <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className=""
                                                                    onClick={() => {
                                                                        onResetBoxCreationData();
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" /> Resetear
                                                                </Button>
                                                                <Button className="w-full" onClick={() => onAddNewBox({ method: 'manual' })}>
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
                                                            />
                                                            <div className="col-span-2 grid grid-cols-2 gap-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className=""
                                                                    onClick={() => {
                                                                        onResetBoxCreationData();
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" /> Resetear
                                                                </Button>
                                                                <Button className="w-full" onClick={() => onAddNewBox({ method: 'bulk' })}>
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
                                                                />
                                                            </div>
                                                            <div className="col-span-3 grid grid-cols-2 gap-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className=""
                                                                    onClick={() => {
                                                                        onResetBoxCreationData();
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-4 w-4" /> Resetear
                                                                </Button>
                                                                <Button className="w-full" onClick={() => onAddNewBox({ method: 'average' })}>
                                                                    <Plus className="h-4 w-4" /> Generar Cajas
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="eliminar" className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                                                            <div className="grid grid-cols-3  gap-x-2">
                                                                <Input
                                                                    value={boxCreationData.deleteScannedCode}
                                                                    onChange={(e) => {
                                                                        boxCreationDataChange("deleteScannedCode", e.target.value);
                                                                    }}

                                                                    type="text"
                                                                    id="codigo-escaneado" placeholder="Escanea aquí..." className="font-mono col-span-2" />
                                                                <Button variant='destructive' className="w-full" onClick={() => handleOnClickDeleteAllBoxes()}>
                                                                    <Trash2 className="h-4 w-4 " /> Eliminar todas las cajas
                                                                </Button>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                La caja se eliminará automáticamente al detectar un código válido
                                                            </p>
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
                                                    <Select value={temporalPallet.orderId} onValueChange={(value) => editPallet.orderId(value)}>
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
                                                    {temporalPallet.orderId && (
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

                                    <div className="space-y-4 overflow-y-auto col-span-3">
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
                                            <div className="overflow-y-auto max-h-[calc(90vh-250px)]">
                                                <Table>
                                                    <TableHeader className="sticky top-0 bg-background">
                                                        <TableRow>
                                                            <TableHead>Artículo</TableHead>
                                                            <TableHead>Lote</TableHead>
                                                            <TableHead>GS1 128</TableHead>
                                                            <TableHead>Peso Neto</TableHead>
                                                            <TableHead className="w-[100px]">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {temporalPallet.boxes.map((box) => box.id === selectedBox ? (
                                                            <TableRow key={box.id} onClick={() => handleOnClickBoxRow(box.id)} className=" hover:bg-muted">
                                                                <TableCell className='whitespace-nowrap'>{box.product.name}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        defaultValue={box.lot}
                                                                        onChange={(e) => {
                                                                            handleOnChangeBoxLot(box.id, e.target.value);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()} // 👈 Esto evita que el click llegue al TableRow
                                                                        className="w-full"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    {box.gs1128}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        defaultValue={box.netWeight}
                                                                        onClick={(e) => e.stopPropagation()} // 👈 Esto evita que el click llegue al TableRow
                                                                        onChange={(e) => {
                                                                            handleOnChangeBoxNetWeight(box.id, parseFloat(e.target.value));
                                                                        }}
                                                                        className="w-full "
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            <TableRow key={box.id} onClick={() => handleOnClickBoxRow(box.id)}
                                                                className={`cursor-text hover:bg-muted ${box?.new === true ? "bg-foreground-50" : ""}`}
                                                            >
                                                                <TableCell>{box.product.name}</TableCell>
                                                                <TableCell>{box.lot}</TableCell>
                                                                <TableCell>{box.gs1128}</TableCell>
                                                                <TableCell>{box.netWeight} kg</TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOnClickDuplicateBox(box.id)
                                                                            }} // 👈 Añadido el evento de clic
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
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="resumen" className="mt-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(90vh-180px)] overflow-y-auto px-2">

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
                                <div className="flex flex-col items-center gap-4 mt-4">
                                    {/* <div className="border p-4 bg-white text-black w-auto">
                                        <PalletLabel pallet={temporalPallet} />
                                    </div> */}

                                    {/* <Button onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Imprimir Etiqueta
                                    </Button> */}

                                    {/* Contenido invisible para imprimir */}
                                    <div style={{ display: "none" }} id='print-area-id'>
                                        <PalletLabel pallet={temporalPallet} />
                                    </div>

                                    {/* <Test /> */}
                                </div>
                            </TabsContent>



                        </Tabs>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={handleOnClickReset}>
                            Deshacer
                        </Button>
                        <Button onClick={handleOnClickSaveChanges}>Guardar</Button>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
