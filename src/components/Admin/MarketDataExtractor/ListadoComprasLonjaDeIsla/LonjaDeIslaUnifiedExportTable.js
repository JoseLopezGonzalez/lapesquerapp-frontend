'use client';

import { Fragment, useMemo, useState } from 'react';
import { Check, X, ChevronRight, ChevronDown, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { calculateImporteFromLinea, parseDecimalValue } from '@/exportHelpers/common';
import {
    aggregateLineasForLonja,
    groupVentasVendiduriasByCodVendiduria,
} from '@/exportHelpers/lonjaDeIslaVendiduriaResumen';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { PORCENTAJE_SERVICIOS_VENDIDURIAS } from './exportData';

function EstadoVacio() {
    return (
        <TableCell className="w-[9.5rem] align-middle text-muted-foreground text-right text-xs">—</TableCell>
    );
}

function EstadoIcono({ exportable }) {
    return (
        <TableCell className="w-[9.5rem] align-middle text-right">
            <div className={`flex justify-end ${exportable ? 'text-green-500' : 'text-red-500'}`}>
                {exportable ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </div>
        </TableCell>
    );
}

function BadgeExportable({ cod, tipo }) {
    const exportable = true;
    return (
        <TableCell className="w-[9.5rem] align-top">
            <div className="flex justify-end pt-0.5">
                {tipo === 'ventaDirecta' && (
                    <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-500/60 text-[10px] px-1.5 py-0"
                    >
                        Venta directa
                    </Badge>
                )}
                {tipo === 'serviciosLonja' && (
                    <Badge
                        variant="outline"
                        className="text-emerald-700 border-emerald-600/50 text-[10px] px-1.5 py-0"
                    >
                        Servicios
                    </Badge>
                )}
                {exportable ? (
                    <div className="flex items-center gap-1 text-green-500">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs">Exportable</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-500">
                        <X className="h-3.5 w-3.5" />
                        <span className="text-xs">No exportable</span>
                    </div>
                )}
            </div>
        </TableCell>
    );
}

function importeServiciosVendiduria(lineas) {
    const imp = aggregateLineasForLonja(lineas).importe;
    return (imp * PORCENTAJE_SERVICIOS_VENDIDURIAS) / 100;
}

function round2(value) {
    return Number((Number(value) || 0).toFixed(2));
}

function normalizeSignedZero(value) {
    return Object.is(value, -0) ? 0 : value;
}

/**
 * Tabla única jerárquica: total por vendiduría → barco → líneas de producto (+ serv. vendiduría por barco);
 * luego venta directa → barcos → líneas; servicios Lonja al final.
 */
export default function LonjaDeIslaUnifiedExportTable({
    ventasVendidurias,
    sourceVendidurias = [],
    ventasDirectas,
    servicios = [],
}) {
    const [expandedByVendiduria, setExpandedByVendiduria] = useState({});

    const gruposV = useMemo(
        () => groupVentasVendiduriasByCodVendiduria(ventasVendidurias),
        [ventasVendidurias],
    );
    const totales = useMemo(() => {
        let mercancia = 0;
        let serviciosVendiduria = 0;

        for (const g of gruposV) {
            for (const barco of g.barcos) {
                const agg = aggregateLineasForLonja(barco.lineas);
                mercancia += agg.importe;
                serviciosVendiduria += importeServiciosVendiduria(barco.lineas);
            }
        }
        return {
            mercancia,
            serviciosVendiduria,
            serviciosLonja: 0,
            general: mercancia + serviciosVendiduria,
        };
    }, [gruposV]);

    const azureTotalsByVendiduria = useMemo(() => {
        const map = {};
        for (const row of sourceVendidurias || []) {
            const cod = row?.cod
                ? String(row.cod)
                : (row?.vendiduria ? String(row.vendiduria).split(' ')[0] : null);
            if (!cod) continue;
            if (!map[cod]) {
                map[cod] = { kilos: 0, importe: 0 };
            }
            map[cod].kilos += parseDecimalValue(row.kilos);
            map[cod].importe += parseDecimalValue(row.importe);
        }
        return map;
    }, [sourceVendidurias]);

    const hasVendidurias = gruposV.length > 0;
    void ventasDirectas;
    void servicios;

    if (!hasVendidurias) {
        return null;
    }

    const renderVendiduriaTotalStatus = (cod, kilosCalc, importeCalc) => {
        const azure = azureTotalsByVendiduria[cod];
        if (!azure) {
            return (
                <TableCell className="w-[9.5rem] align-middle text-right">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-end">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 cursor-help">
                                        <TriangleAlert className="h-3.5 w-3.5" />
                                        Sin total doc
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={8}>
                                <div className="space-y-2 min-w-[250px]">
                                    <p className="font-semibold">No hay totales de documento</p>
                                    <p>Vendiduría: {cod}</p>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                                        <span className="text-background/70">Kilos app</span>
                                        <span className="text-right">{formatDecimalWeight(kilosCalc)}</span>
                                        <span className="text-background/70">Importe app</span>
                                        <span className="text-right">{formatDecimalCurrency(importeCalc)}</span>
                                    </div>
                                    <p className="text-amber-300">El documento no tiene registro de totales para esta vendiduria.</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>
            );
        }

        const kilosDelta = normalizeSignedZero(round2(kilosCalc - azure.kilos));
        const importeDelta = normalizeSignedZero(round2(importeCalc - azure.importe));
        const kilosDiff = Math.abs(kilosDelta);
        const importeDiff = Math.abs(importeDelta);
        const ok = kilosDiff <= 0.01 && importeDiff <= 0.01;

        return (
            <TableCell className="w-[9.5rem] align-middle text-right">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center justify-end">
                                {ok ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 cursor-help">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Validado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 cursor-help">
                                        <TriangleAlert className="h-3.5 w-3.5" />
                                        No validado
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={8}>
                            <div className="space-y-2 min-w-[300px]">
                                <p className="font-semibold">{ok ? 'Comparación validada' : 'Descuadre detectado'}</p>
                                <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1">
                                    <span className="text-background/70">Fuente</span>
                                    <span className="text-right text-background/70">Kilos</span>
                                    <span className="text-right text-background/70">Importe</span>

                                    <span>App</span>
                                    <span className="text-right">{formatDecimalWeight(kilosCalc)}</span>
                                    <span className="text-right">{formatDecimalCurrency(importeCalc)}</span>

                                    <span>Documento</span>
                                    <span className="text-right">{formatDecimalWeight(azure.kilos)}</span>
                                    <span className="text-right">{formatDecimalCurrency(azure.importe)}</span>

                                    <span className="font-medium">Diferencia</span>
                                    <span className="text-right font-medium">
                                        {kilosDelta > 0 ? '+' : ''}{formatDecimalWeight(kilosDelta)}
                                    </span>
                                    <span className="text-right font-medium">
                                        {importeDelta > 0 ? '+' : ''}{formatDecimalCurrency(importeDelta)}
                                    </span>
                                </div>
                                {!ok && (
                                    <p className="text-red-300">
                                        Tolerancia usada: 0,01 kg y 0,01 EUR.
                                    </p>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
        );
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">Desglose por vendiduría y barcos</CardTitle>
                    <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-500/60 text-[10px] px-1.5 py-0"
                    >
                        Vendiduría
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                    Totales por vendiduría, subtotales por barco y detalle de cada línea de venta.
                    Incluye servicios de vendiduría por barco y servicios de Lonja en venta directa.
                </p>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6 pt-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[14rem]">Concepto</TableHead>
                            <TableHead className="text-right w-20">Cajas</TableHead>
                            <TableHead className="text-right w-24">Peso neto</TableHead>
                            <TableHead className="text-right w-24">Precio</TableHead>
                            <TableHead className="text-right w-28">Importe</TableHead>
                            <TableHead className="w-[9.5rem] text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gruposV.map((grupo) => {
                            const isExpanded = expandedByVendiduria[grupo.vendiduria.cod] ?? false;
                            const totGrupo = grupo.barcos.reduce(
                                (acc, b) => {
                                    const a = aggregateLineasForLonja(b.lineas);
                                    acc.cajas += a.cajas;
                                    acc.kilos += a.kilos;
                                    acc.importe += a.importe;
                                    return acc;
                                },
                                { cajas: 0, kilos: 0, importe: 0 },
                            );
                            return (
                                <Fragment key={grupo.vendiduria.cod}>
                                    <TableRow
                                        className="bg-muted/60 font-semibold hover:bg-muted/60 cursor-pointer"
                                        onClick={() =>
                                            setExpandedByVendiduria((prev) => ({
                                                ...prev,
                                                [grupo.vendiduria.cod]: !isExpanded,
                                            }))
                                        }
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span>
                                                    {grupo.vendiduria.cod} — {grupo.vendiduria.nombre}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{totGrupo.cajas}</TableCell>
                                        <TableCell className="text-right">
                                            {formatDecimalWeight(totGrupo.kilos)}
                                        </TableCell>
                                        <TableCell className="text-right">—</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatDecimalCurrency(totGrupo.importe)}
                                        </TableCell>
                                        {renderVendiduriaTotalStatus(
                                            grupo.vendiduria.cod,
                                            totGrupo.kilos,
                                            totGrupo.importe,
                                        )}
                                    </TableRow>
                                    {isExpanded && grupo.barcos.map((barco) => {
                                        const aggBarco = aggregateLineasForLonja(barco.lineas);
                                        const srvVend = importeServiciosVendiduria(barco.lineas);
                                        const barcoExportable = true;
                                        return (
                                            <Fragment key={`${grupo.vendiduria.cod}-${barco.cod}`}>
                                                <TableRow className="bg-muted/35 font-medium hover:bg-muted/35">
                                                    <TableCell className="pl-6">
                                                        <span className="block">{barco.nombre}</span>
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            Barco · {barco.vendiduria?.nombre}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {aggBarco.cajas}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimalWeight(aggBarco.kilos)}
                                                    </TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimalCurrency(aggBarco.importe)}
                                                    </TableCell>
                                                    <BadgeExportable cod={barco.cod} tipo="vendiduria" />
                                                </TableRow>
                                                {barco.lineas.map((linea, idx) => (
                                                    <TableRow
                                                        key={`${barco.cod}-l-${idx}`}
                                                        className="hover:bg-muted/20"
                                                    >
                                                        <TableCell className="pl-10 text-muted-foreground">
                                                            {linea.especie}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {linea.cajas}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatDecimalWeight(
                                                                parseDecimalValue(linea.kilos),
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatDecimalCurrency(
                                                                parseDecimalValue(linea.precio),
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatDecimalCurrency(
                                                                calculateImporteFromLinea(linea),
                                                            )}
                                                        </TableCell>
                                                        <EstadoIcono exportable={barcoExportable} />
                                                    </TableRow>
                                                ))}
                                                <TableRow className="italic text-muted-foreground hover:bg-muted/15">
                                                    <TableCell className="pl-8">
                                                        Servicios vendiduría (
                                                        {PORCENTAJE_SERVICIOS_VENDIDURIAS}%)
                                                    </TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right">—</TableCell>
                                                    <TableCell className="text-right not-italic text-foreground font-medium">
                                                        {formatDecimalCurrency(srvVend)}
                                                    </TableCell>
                                                    <EstadoIcono exportable={barcoExportable} />
                                                </TableRow>
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}

                        <TableRow className="border-t-2 bg-muted/30 font-medium">
                            <TableCell colSpan={4}>Total mercancía (vendidurías)</TableCell>
                            <TableCell className="text-right">
                                {formatDecimalCurrency(totales.mercancia)}
                            </TableCell>
                            <EstadoVacio />
                        </TableRow>
                        <TableRow className="bg-muted/20 text-sm">
                            <TableCell colSpan={4}>
                                Total servicios vendiduría ({PORCENTAJE_SERVICIOS_VENDIDURIAS}%)
                            </TableCell>
                            <TableCell className="text-right">
                                {formatDecimalCurrency(totales.serviciosVendiduria)}
                            </TableCell>
                            <EstadoVacio />
                        </TableRow>
                        <TableRow className="bg-muted/50 font-semibold text-base">
                            <TableCell colSpan={4}>Total vendidurías (estimado)</TableCell>
                            <TableCell className="text-right">
                                {formatDecimalCurrency(totales.general)}
                            </TableCell>
                            <EstadoVacio />
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
