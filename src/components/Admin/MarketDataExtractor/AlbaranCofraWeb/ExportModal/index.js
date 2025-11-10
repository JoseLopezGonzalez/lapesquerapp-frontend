import { fetchWithTenant } from "@lib/fetchWithTenant";
import React, { useState, useEffect } from 'react'
import { Check, X, AlertTriangle, FileSpreadsheet, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { armadores, barcos, lonjas } from '../exportData'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDecimalCurrency, formatDecimalWeight, parseEuropeanNumber } from '@/helpers/formats/numbers/formatNumbers'
import toast from 'react-hot-toast'
import { getToastTheme } from '@/customs/reactHotToast'
import { API_URL_V1 } from '@/configs/config'

const parseDecimalValue = (value) => {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return 0;
        if (trimmed.includes(',')) {
            const parsed = parseEuropeanNumber(trimmed);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        const dotMatches = trimmed.match(/\./g);
        if (dotMatches && dotMatches.length > 1) {
            const parts = trimmed.split('.');
            const decimalPart = parts.pop();
            const integerPart = parts.join('');
            const reconstructed = `${integerPart}.${decimalPart}`;
            const parsed = Number(reconstructed);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
};

const calculateImporte = (weight, price) => {
    const kilos = parseDecimalValue(weight);
    const precio = parseDecimalValue(price);
    const importe = kilos * precio;
    return Number.isFinite(importe) ? Number(importe.toFixed(2)) : 0;
};

const calculateImporteFromLinea = (linea) => calculateImporte(linea.kilos, linea.precio);

const ExportModal = ({ document }) => {
    const { detalles: { numero, fecha, cifLonja, lonja } } = document
    const [software, setSoftware] = useState("A3ERP")
    const [initialAlbaranNumber, setInitialAlbaranNumber] = useState("")
    const [selectedLinks, setSelectedLinks] = useState([])

    const isConvertibleLonja = lonjas.some((lonja) => lonja.cif === cifLonja)

    const subastasGroupedByBarco = document.tablas.subastas.reduce((acc, item) => {
        if (!acc[item.barco]) {
            acc[item.barco] = {
                nombre: item.barco,
                cod: item.cod,
                armador: item.armador,
                cifArmador: item.cifArmador,
                lineas: []
            };
        }
        acc[item.barco].lineas.push(item);
        return acc;
    }, {});
    const subastas = Object.values(subastasGroupedByBarco);

    const isConvertibleArmador = (cifArmador) => {
        return armadores.some((armador) => armador.cif === cifArmador);
    };

    const isSomeArmadorNotConvertible = subastas.some((barco) => !isConvertibleArmador(barco.cifArmador));

    const servicios = document.tablas.servicios;

    const generateExcelForA3erp = () => {
        const processedRows = [];
        let albaranNumber = Number(initialAlbaranNumber);

        // Agrupamos líneas de subasta por armador
        const groupedByArmador = subastas.reduce((acc, line) => {
            const key = line.cifArmador;
            if (!acc[key]) acc[key] = [];
            acc[key].push(line);
            return acc;
        }, {});

        for (const [cifArmador, lines] of Object.entries(groupedByArmador)) {
            const armadorData = armadores.find(a => a.cif === cifArmador);
            if (!armadorData) {
                console.error(`Falta código de conversión para armador ${cifArmador}`);
                continue; // o lanza un toast o marca el error visualmente
            }

            lines.forEach(barco => {
                barco.lineas.forEach(linea => {
                    processedRows.push({
                        CABNUMDOC: albaranNumber,
                        CABFECHA: fecha,
                        CABCODPRO: armadorData.codA3erp,
                        CABREFERENCIA: `${fecha} - ${numero} -  ${barco.nombre}`,
                        LINCODART: 95,
                        LINDESCLIN: 'PULPO FRESCO LONJA',
                        LINUNIDADES: parseDecimalValue(linea.kilos),
                        LINPRCMONEDA: parseDecimalValue(linea.precio),
                        LINTIPIVA: 'RED10',
                    });
                });
            });

            albaranNumber++;
        }

        // Albarán para la lonja con los servicios
        const lonjaData = lonjas.find(l => l.cif === cifLonja);
        if (!lonjaData) {
            console.error(`Falta código de conversión para la lonja ${cifLonja}`);
        } else {
            servicios.forEach(line => {
                const unidades = parseDecimalValue(line.unidades);
                const importe = parseDecimalValue(line.importe);
                const calculatedPrecio = unidades === 0 ? 0 : Number((importe / unidades).toFixed(4));
                processedRows.push({
                    CABNUMDOC: albaranNumber,
                    CABFECHA: fecha,
                    CABCODPRO: lonjaData.codA3erp,
                    CABREFERENCIA: `${fecha} - ${numero} - SERVICIOS`,
                    LINCODART: 9998,
                    LINDESCLIN: line.descripcion,
                    LINUNIDADES: line.unidades,
                    LINPRCMONEDA: calculatedPrecio,
                    LINTIPIVA: 'ORD21',
                });
            });

            albaranNumber++;
        }

        // Crear el libro y hoja
        const worksheet = XLSX.utils.json_to_sheet(processedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ALBARANESCOMPRA');

        // Guardar archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xls', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
        saveAs(blob, `ALBARANES_A3ERP_COFRA_SANTO_CRISTO_${fecha}.xls`);
    };

    const handleOnClickExport = () => {
        if (initialAlbaranNumber === "") {
            toast.error('Introduzca un número de albarán inicial', getToastTheme());
            return;
        }

        if (software === "A3ERP") {
            generateExcelForA3erp();
        } else if (software === "Facilcom") {
            // generateExcelForFacilcom();
        } else {
            // generateExcelForOtros();
        }
    };

    const linkedSummary = subastas.map((barco) => {
        const declaredTotalNetWeight = barco.lineas.reduce((acc, linea) => acc + parseDecimalValue(linea.kilos), 0);
        const declaredTotalAmount = barco.lineas.reduce((acc, linea) => acc + calculateImporteFromLinea(linea), 0);

        const barcoEncontrado = barcos.find(b =>
            b.barco === barco.nombre);

        const codBrisappArmador = barcoEncontrado?.codBrisapp ?? null;

        return {
            supplierId: codBrisappArmador,
            date: fecha,
            declaredTotalNetWeight: parseFloat(declaredTotalNetWeight.toFixed(2)),
            declaredTotalAmount: parseFloat(declaredTotalAmount.toFixed(2)),
            barcoNombre: barco.nombre,
            error: codBrisappArmador === null ? true : false,
        };
    });

    // Inicializar las selecciones cuando cambia linkedSummary
    useEffect(() => {
        // Seleccionar por defecto solo las que no tienen error
        const initialSelection = linkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        setSelectedLinks(initialSelection);
    }, [linkedSummary.length]);

    // Función para manejar selección/deselección de una línea
    const handleToggleLink = (index) => {
        setSelectedLinks(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    // Función para seleccionar/deseleccionar todas las líneas sin error
    const handleToggleAll = () => {
        const validIndices = linkedSummary
            .map((linea, index) => (!linea.error ? index : null))
            .filter(index => index !== null);
        
        if (selectedLinks.length === validIndices.length) {
            // Si todas están seleccionadas, deseleccionar todas
            setSelectedLinks([]);
        } else {
            // Si no todas están seleccionadas, seleccionar todas las válidas
            setSelectedLinks(validIndices);
        }
    };

    const handleOnClickLinkPurchases = async () => {
        // Filtrar solo las compras seleccionadas
        const comprasSeleccionadas = linkedSummary.filter((linea, index) => 
            selectedLinks.includes(index) && !linea.error
        );

        if (comprasSeleccionadas.length === 0) {
            toast.error('No hay compras seleccionadas para vincular.', getToastTheme());
            return;
        }

        let correctas = 0;
        let errores = 0;

        await Promise.allSettled(comprasSeleccionadas.map(async (linea) => {
            try {
                const res = await fetchWithTenant(`${API_URL_V1}raw-material-receptions/update-declared-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplier_id: linea.supplierId,
                        date: linea.date.split('/').reverse().join('-'),
                        declared_total_net_weight: linea.declaredTotalNetWeight,
                        declared_total_amount: linea.declaredTotalAmount,
                    }),
                });

                if (!res.ok) throw new Error();
                correctas++;
            } catch (error) {
                errores++;
                console.error(`Error al actualizar compra de ${linea.barcoNombre}`, error);
                toast.error(`Error al actualizar compra de ${linea.barcoNombre}`, getToastTheme());
            }
        }));

        if (correctas > 0) {
            toast.success(`Compras enlazadas correctamente (${correctas})`, getToastTheme());
        }

        if (errores > 0) {
            toast.error(`${errores} compras fallaron al enlazar`, getToastTheme());
        }
    };

    return (
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Exportar Datos de Factura</DialogTitle>
                <DialogDescription>
                    Seleccione el software de destino y verifique los datos antes de exportar.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                    <div className='flex flex-col gap-1'>
                        <label htmlFor="software" className=" font-medium">
                            Software
                        </label>
                        <Select value={software} onValueChange={setSoftware}>
                            <SelectTrigger id="software" className="col-span-3">
                                <SelectValue placeholder="Seleccione software de destino" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A3ERP">A3ERP</SelectItem>
                                <SelectItem value="Facilcom">Facilcom</SelectItem>
                                <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label htmlFor="software" className=" font-medium">
                            Contador Inicio Albaranes
                        </label>
                        <Input type="number" value={initialAlbaranNumber} placeholder='000' onChange={(e) => setInitialAlbaranNumber(e.target.value)} />
                    </div>
                </div>
                <div className='flex flex-col gap-1'>
                    {!isConvertibleLonja ? (
                        <div className="flex items-center gap-1 p-1  text-amber-500  rounded-md ">
                            <AlertTriangle className="h-4 w-4 " />
                            <span className="text-xs">
                                Los servicios de la lonja <strong>{lonja} - {cifLonja}</strong> no son exportables.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500   rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Los servicios de la lonja <strong>{lonja} - {cifLonja}</strong> son exportables.
                            </span>
                        </div>
                    )}

                    {isSomeArmadorNotConvertible ? (
                        <div className="flex items-center gap-1 p-1  text-amber-500  rounded-md ">
                            <AlertTriangle className="h-4 w-4 " />
                            <span className="text-xs">
                                Todos los armadores no son exportables.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 p-1  text-green-500  rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">
                                Todos los armadores son exportables.
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-4 mt-2">

                    {linkedSummary.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle>
                                        <div className='flex flex-col gap-1'>
                                            <span className="text-lg">Enlaces de compra/recepción</span>
                                            <span className="text-sm text-muted-foreground">
                                                {linkedSummary.length} Compras
                                            </span>
                                        </div>
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox 
                                                    checked={
                                                        linkedSummary.filter(l => !l.error).length > 0 &&
                                                        selectedLinks.length === linkedSummary.filter(l => !l.error).length
                                                    }
                                                    onCheckedChange={handleToggleAll}
                                                />
                                            </TableHead>
                                            <TableHead>Barco</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Peso Neto</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {linkedSummary.map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={selectedLinks.includes(index)}
                                                        disabled={linea.error}
                                                        onCheckedChange={() => handleToggleLink(index)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{linea.barcoNombre}</TableCell>
                                                <TableCell className="font-medium">{linea.date}</TableCell>
                                                <TableCell className="text-right">{formatDecimalWeight(linea.declaredTotalNetWeight)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatDecimalCurrency(linea.declaredTotalAmount)}
                                                </TableCell>
                                                <TableCell className={` ${linea.error ? 'text-red-500' : 'text-green-500'}`}>
                                                    {linea.error ? (
                                                        <div className="flex items-center gap-2">
                                                            <X className="h-4 w-4" />
                                                            <span className="text-xs">No enlazable</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="h-4 w-4" />
                                                            <span className="text-xs">Listo</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <div className="flex justify-between items-center p-2 mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedLinks.length} de {linkedSummary.filter(l => !l.error).length} seleccionadas
                                </span>
                                <Button 
                                    variant="" 
                                    className="" 
                                    onClick={() => handleOnClickLinkPurchases()}
                                    disabled={selectedLinks.length === 0}
                                >
                                    <Link className="h-4 w-4" />
                                    Enlazar Compras ({selectedLinks.length})
                                </Button>
                            </div>

                        </Card>
                    )}

                    {subastas.map((barco) => (
                        <Card key={barco.cod}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">{barco.nombre}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{barco.armador}</span>
                                        {isConvertibleArmador(barco.cifArmador) ? (
                                            <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                                <Check className="h-3.5 w-3.5" />
                                                Exportable
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                                <X className="h-3.5 w-3.5" />
                                                No exportable
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cajas</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {barco.lineas.map((linea, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{linea.cajas}</TableCell>
                                                <TableCell>{linea.pescado}</TableCell>
                                                <TableCell className="text-right">{linea.kilos}</TableCell>
                                                <TableCell className="text-right">{linea.precio} €</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {linea.importe} €
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Servicios</CardTitle>
                                <div className="flex items-center gap-2">
                                    {isConvertibleLonja ? (
                                        <Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
                                            <Check className="h-3.5 w-3.5" />
                                            Exportable
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
                                            <X className="h-3.5 w-3.5" />
                                            No exportable
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cod</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Fecha</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        {/* iva */}
                                        <TableHead className="text-right">Iva</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servicios.map((servicio, index) => (
                                        <TableRow key={index} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{servicio.codigo}</TableCell>
                                            <TableCell>{servicio.descripcion}</TableCell>
                                            <TableCell className="text-right">{servicio.fecha}</TableCell>
                                            <TableCell className="text-right">{servicio.unidades}</TableCell>
                                            <TableCell className="text-right">{servicio.precio} €</TableCell>
                                            <TableCell className="text-right">{servicio.iva} €</TableCell>
                                            <TableCell className="text-right font-medium">{servicio.importe} €</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DialogFooter>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        Cancelar
                    </Button>
                </DialogTrigger>
                <Button className="gap-2" onClick={handleOnClickExport}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar a A3ERP
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default ExportModal