"use client";

import { useEffect, useState } from "react";
import {
    Copy,
    Trash2,
    X,
    Scan,
    Plus,
    Upload,
    Package,
    FileText,
    Edit,
    Eye,
    BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useStoreContext } from "@/context/StoreContext";

export default function PalletDialog() {
    const { closePalletDialog, isOpenPalletDialog, palletDialogData } = useStoreContext();
    const [temporalPalletData, setTemporalPalletData] = useState(null);

    useEffect(() => {
        if (isOpenPalletDialog && palletDialogData) {
            setTemporalPalletData({ ...palletDialogData });
        }
    }, [isOpenPalletDialog, palletDialogData]);

    if (!temporalPalletData) return null;

    const totalWeight = temporalPalletData.boxes
        .reduce((acc, box) => acc + parseFloat(box.netWeight), 0)
        .toFixed(2);

    const numberOfBoxes = temporalPalletData.boxes.length;

    const resumenProductos = temporalPalletData.boxes.reduce((acc, box) => {
        const producto = box.product.name;
        const lote = box.lot;
        if (!acc[producto]) {
            acc[producto] = { totalCajas: 0, totalPeso: 0, lotes: {} };
        }
        acc[producto].totalCajas += 1;
        acc[producto].totalPeso += parseFloat(box.netWeight);
        if (!acc[producto].lotes[lote]) {
            acc[producto].lotes[lote] = [];
        }
        acc[producto].lotes[lote].push(parseFloat(box.netWeight));
        return acc;
    }, {});

    const totalProductos = Object.keys(resumenProductos).length;

    const lotesUnicos = new Set();
    temporalPalletData.boxes.forEach((box) => lotesUnicos.add(box.lot));
    const totalLotes = lotesUnicos.size;

    return (
        <Dialog open={isOpenPalletDialog} onOpenChange={closePalletDialog}>
            <DialogContent className="w-full max-w-[95vw] max-h-[90vw] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Editar Palet #{temporalPalletData.id}
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
                        </TabsList>

                        <TabsContent value="edicion" className="mt-0">
                            <div className="grid grid-cols-5 gap-6 h-[calc(90vh-180px)]">
                                {/* Panel izquierdo */}
                                <div className="space-y-6 overflow-y-auto pr-2 col-span-2">
                                    <Card className="border-2 border-muted bg-foreground-50">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Package className="h-5 w-5 text-primary" />
                                                Agregar Cajas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tabs defaultValue="lector" className="w-full">
                                                <TabsList className="grid w-full grid-cols-4">
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
                                                </TabsList>

                                                {/* Lector */}
                                                <TabsContent value="lector" className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="codigo-escaneado">Código escaneado</Label>
                                                        <Input id="codigo-escaneado" placeholder="Escanea aquí..." className="font-mono" />
                                                        <p className="text-xs text-muted-foreground">
                                                            La caja se agregará automáticamente al detectar un código válido
                                                        </p>
                                                    </div>
                                                </TabsContent>

                                                {/* Manual */}
                                                <TabsContent value="manual" className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Artículo</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar artículo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="art-001">Tomate Cherry 250g</SelectItem>
                                                                    <SelectItem value="art-002">Lechuga Iceberg 500g</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Lote</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar lote" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="lote-001">L240115001</SelectItem>
                                                                    <SelectItem value="lote-002">L240115002</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Peso Neto (kg)</Label>
                                                            <Input type="number" step="0.01" placeholder="0.00" className="text-right" />
                                                        </div>
                                                        <Button className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" /> Agregar Caja
                                                        </Button>
                                                    </div>
                                                </TabsContent>

                                                {/* Masiva */}
                                                <TabsContent value="masiva" className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Artículo</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar artículo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="art-001">Tomate Cherry 250g</SelectItem>
                                                                    <SelectItem value="art-002">Lechuga Iceberg 500g</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Lote</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar lote" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="lote-001">L240115001</SelectItem>
                                                                    <SelectItem value="lote-002">L240115002</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Pesos (uno por línea)</Label>
                                                            <Textarea defaultValue="13.45\n14.20\n12.80\n15.10" className="min-h-[120px]" />
                                                        </div>
                                                        <Button className="w-full">
                                                            <Upload className="h-4 w-4 mr-2" /> Agregar Cajas en Lote
                                                        </Button>
                                                    </div>
                                                </TabsContent>

                                                {/* Promedio */}
                                                <TabsContent value="promedio" className="space-y-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Artículo</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar artículo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="art-001">Tomate Cherry 250g</SelectItem>
                                                                    <SelectItem value="art-002">Lechuga Iceberg 500g</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Lote</Label>
                                                            <Select>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Seleccionar lote" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="lote-001">L240115001</SelectItem>
                                                                    <SelectItem value="lote-002">L240115002</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Peso Total (kg)</Label>
                                                            <Input type="number" step="0.01" placeholder="0.00" className="text-right" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Número de Cajas</Label>
                                                            <Input type="number" placeholder="0" className="text-right" />
                                                        </div>
                                                        <Button className="w-full">
                                                            <Plus className="h-4 w-4 mr-2" /> Generar Cajas
                                                        </Button>
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
                                                    defaultValue={temporalPalletData.observations || ""}
                                                    onChange={(e) =>
                                                        setTemporalPalletData({
                                                            ...temporalPalletData,
                                                            observations: e.target.value,
                                                        })
                                                    }
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pedido vinculado (opcional)</Label>
                                                <Select>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sin pedido asignado" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pedido-001">Pedido #001</SelectItem>
                                                        <SelectItem value="pedido-002">Pedido #002</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Panel derecho */}
                                <div className="space-y-4 overflow-y-auto col-span-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Cajas en el Palet</h3>
                                        <Badge variant="secondary" className="text-lg px-3 py-1">
                                            {numberOfBoxes} cajas • {totalWeight} kg
                                        </Badge>
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
                                                    {temporalPalletData.boxes.map((box) => (
                                                        <TableRow key={box.id}>
                                                            <TableCell>{box.product.name}</TableCell>
                                                            <TableCell>{box.lot}</TableCell>
                                                            <TableCell>{box.gs1128}</TableCell>
                                                            <TableCell>{box.netWeight} kg</TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Copy className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive"
                                                                        onClick={() => {
                                                                            setTemporalPalletData({
                                                                                ...temporalPalletData,
                                                                                boxes: temporalPalletData.boxes.filter((b) => b.id !== box.id),
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Resumen detallado */}
                        <TabsContent value="resumen" className="mt-0">
                            <div className="h-[calc(90vh-180px)] overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Resumen general */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-xl">
                                                Resumen General del Palet
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold">
                                                        {numberOfBoxes}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Total Cajas
                                                    </div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold">
                                                        {totalWeight} kg
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Peso Total
                                                    </div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold">
                                                        {totalProductos}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Productos
                                                    </div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold">
                                                        {totalLotes}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Lotes
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Desglose por productos */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {Object.entries(resumenProductos).map(
                                            ([productName, productData]) => (
                                                <Card key={productName}>
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-lg">
                                                            {productName}
                                                        </CardTitle>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-semibold">
                                                                Total: {productData.totalCajas} cajas
                                                            </span>
                                                            <span className="font-semibold">
                                                                {productData.totalPeso.toFixed(2)} kg
                                                            </span>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            {Object.entries(productData.lotes).map(
                                                                ([lot, weights]) => (
                                                                    <div
                                                                        key={lot}
                                                                        className="p-3 border rounded-lg"
                                                                    >
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="font-medium">
                                                                                Lote: {lot}
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                {weights.length} cajas
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="space-y-1 text-sm">
                                                                            {weights.map((weight, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="flex justify-between"
                                                                                >
                                                                                    <span>Caja {index + 1}:</span>
                                                                                    <span>{weight.toFixed(2)} kg</span>
                                                                                </div>
                                                                            ))}
                                                                            <Separator />
                                                                            <div className="flex justify-between font-medium">
                                                                                <span>Subtotal:</span>
                                                                                <span>
                                                                                    {weights
                                                                                        .reduce(
                                                                                            (sum, w) => sum + w,
                                                                                            0
                                                                                        )
                                                                                        .toFixed(2)}{" "}
                                                                                    kg
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={closePalletDialog}>
                        Cancelar
                    </Button>
                    <Button onClick={() => console.log()}>Guardar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
