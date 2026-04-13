'use client';

import { Fragment, useMemo } from 'react';
import { Check, X } from 'lucide-react';
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
import { calculateImporteFromLinea, parseDecimalValue } from '@/exportHelpers/common';
import {
    aggregateLineasForLonja,
    groupVentasVendiduriasByCodVendiduria,
} from '@/exportHelpers/lonjaDeIslaVendiduriaResumen';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { barcos, PORCENTAJE_SERVICIOS_VENDIDURIAS } from './exportData';

function barcoCodEnCatalogo(cod) {
    return barcos.some((b) => String(b.cod) === String(cod));
}

function EstadoVacio() {
    return (
        <TableCell className="w-[9.5rem] align-middle text-muted-foreground text-right text-xs">—</TableCell>
    );
}

function BadgeExportable({ cod, tipo }) {
    const exportable =
        tipo === 'serviciosLonja' ? true : barcoCodEnCatalogo(cod);
    return (
        <TableCell className="w-[9.5rem] align-top">
            <div className="flex flex-col items-end gap-1 pt-0.5">
                {tipo === 'vendiduria' && (
                    <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-500/60 text-[10px] px-1.5 py-0"
                    >
                        Vendiduría
                    </Badge>
                )}
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
                    <Badge
                        variant="outline"
                        className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1 text-[10px] px-1.5 py-0"
                    >
                        <Check className="h-3 w-3 shrink-0" />
                        Exportable
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1 text-[10px] px-1.5 py-0"
                    >
                        <X className="h-3 w-3 shrink-0" />
                        No exportable
                    </Badge>
                )}
            </div>
        </TableCell>
    );
}

function importeServiciosVendiduria(lineas) {
    const imp = aggregateLineasForLonja(lineas).importe;
    return (imp * PORCENTAJE_SERVICIOS_VENDIDURIAS) / 100;
}

/**
 * Tabla única jerárquica: total por vendiduría → barco → líneas de producto (+ serv. vendiduría por barco);
 * luego venta directa → barcos → líneas; servicios Lonja al final.
 */
export default function LonjaDeIslaUnifiedExportTable({
    ventasVendidurias,
    ventasDirectas,
    servicios = [],
}) {
    const gruposV = useMemo(
        () => groupVentasVendiduriasByCodVendiduria(ventasVendidurias),
        [ventasVendidurias],
    );
    const ventasDirectasArray = useMemo(
        () =>
            Object.values(ventasDirectas || {})
                .filter(Boolean)
                .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')),
        [ventasDirectas],
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
        for (const barco of ventasDirectasArray) {
            mercancia += aggregateLineasForLonja(barco.lineas).importe;
        }
        const serviciosLonja =
            ventasDirectasArray.length > 0
                ? (servicios || []).reduce((s, x) => s + (Number(x.importe) || 0), 0)
                : 0;
        return {
            mercancia,
            serviciosVendiduria,
            serviciosLonja,
            general: mercancia + serviciosVendiduria + serviciosLonja,
        };
    }, [gruposV, ventasDirectasArray, servicios]);

    const hasVendidurias = gruposV.length > 0;
    const hasVentaDirecta = ventasDirectasArray.length > 0;
    const showServiciosLonja = hasVentaDirecta && servicios.length > 0;

    if (!hasVendidurias && !hasVentaDirecta) {
        return null;
    }

    return (
        <Card className="border-muted">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Desglose por vendiduría y barcos</CardTitle>
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
                                    <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
                                        <TableCell>
                                            {grupo.vendiduria.cod} — {grupo.vendiduria.nombre}
                                        </TableCell>
                                        <TableCell className="text-right">{totGrupo.cajas}</TableCell>
                                        <TableCell className="text-right">
                                            {formatDecimalWeight(totGrupo.kilos)}
                                        </TableCell>
                                        <TableCell className="text-right">—</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatDecimalCurrency(totGrupo.importe)}
                                        </TableCell>
                                        <EstadoVacio />
                                    </TableRow>
                                    {grupo.barcos.map((barco) => {
                                        const aggBarco = aggregateLineasForLonja(barco.lineas);
                                        const srvVend = importeServiciosVendiduria(barco.lineas);
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
                                                        <EstadoVacio />
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
                                                    <EstadoVacio />
                                                </TableRow>
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}

                        {hasVentaDirecta && (
                            <>
                                {(() => {
                                    const totVd = ventasDirectasArray.reduce(
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
                                        <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
                                            <TableCell>Venta directa</TableCell>
                                            <TableCell className="text-right">{totVd.cajas}</TableCell>
                                            <TableCell className="text-right">
                                                {formatDecimalWeight(totVd.kilos)}
                                            </TableCell>
                                            <TableCell className="text-right">—</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatDecimalCurrency(totVd.importe)}
                                            </TableCell>
                                            <EstadoVacio />
                                        </TableRow>
                                    );
                                })()}
                                {ventasDirectasArray.map((barco) => {
                                    const aggBarco = aggregateLineasForLonja(barco.lineas);
                                    return (
                                        <Fragment key={`vd-${barco.cod}`}>
                                            <TableRow className="bg-muted/35 font-medium hover:bg-muted/35">
                                                <TableCell className="pl-6">
                                                    <span className="block">{barco.nombre}</span>
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        {barco.armador?.nombre}
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
                                                <BadgeExportable cod={barco.cod} tipo="ventaDirecta" />
                                            </TableRow>
                                            {barco.lineas.map((linea, idx) => (
                                                <TableRow
                                                    key={`vd-${barco.cod}-l-${idx}`}
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
                                                    <EstadoVacio />
                                                </TableRow>
                                            ))}
                                        </Fragment>
                                    );
                                })}
                            </>
                        )}

                        {showServiciosLonja && (
                            <>
                                <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
                                    <TableCell className="pl-6">
                                        Servicios Lonja de Isla Cristina
                                    </TableCell>
                                    <TableCell className="text-right">—</TableCell>
                                    <TableCell className="text-right">—</TableCell>
                                    <TableCell className="text-right">—</TableCell>
                                    <TableCell className="text-right">
                                        {formatDecimalCurrency(
                                            servicios.reduce((s, x) => s + (Number(x.importe) || 0), 0),
                                        )}
                                    </TableCell>
                                    <BadgeExportable tipo="serviciosLonja" />
                                </TableRow>
                                {servicios.map((s, i) => (
                                    <TableRow key={`srv-${i}`} className="hover:bg-muted/15">
                                        <TableCell className="pl-10 text-muted-foreground">
                                            {s.descripcion}
                                            <span className="block text-xs mt-0.5">
                                                Base {formatDecimalCurrency(s.base)} · {s.porcentaje}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">—</TableCell>
                                        <TableCell className="text-right">—</TableCell>
                                        <TableCell className="text-right">
                                            {formatDecimalCurrency(s.precio)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatDecimalCurrency(s.importe)}
                                        </TableCell>
                                        <EstadoVacio />
                                    </TableRow>
                                ))}
                            </>
                        )}

                        <TableRow className="border-t-2 bg-muted/30 font-medium">
                            <TableCell colSpan={4}>Total mercancía (vendidurías + venta directa)</TableCell>
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
                        <TableRow className="bg-muted/20 text-sm">
                            <TableCell colSpan={4}>Total servicios Lonja</TableCell>
                            <TableCell className="text-right">
                                {formatDecimalCurrency(totales.serviciosLonja)}
                            </TableCell>
                            <EstadoVacio />
                        </TableRow>
                        <TableRow className="bg-muted/50 font-semibold text-base">
                            <TableCell colSpan={4}>Total documento (estimado)</TableCell>
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
