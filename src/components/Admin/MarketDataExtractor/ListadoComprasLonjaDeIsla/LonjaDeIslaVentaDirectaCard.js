'use client';

import { Fragment, useState } from 'react';
import { Check, X, ChevronRight, ChevronDown } from 'lucide-react';
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
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';
import { calculateImporteFromLinea, parseDecimalValue } from '@/exportHelpers/common';

function aggregateLineas(lineas) {
  return (lineas || []).reduce(
    (acc, linea) => {
      acc.cajas += Number(linea.cajas) || 0;
      acc.kilos += parseDecimalValue(linea.kilos);
      acc.importe += calculateImporteFromLinea(linea);
      return acc;
    },
    { cajas: 0, kilos: 0, importe: 0 }
  );
}

export default function LonjaDeIslaVentaDirectaCard({ ventasDirectasArray = [], servicios = [] }) {
  const [expandedByBarco, setExpandedByBarco] = useState({});

  if (!ventasDirectasArray.length) return null;

  const totalVentaDirecta = ventasDirectasArray.reduce(
    (acc, barco) => {
      const agg = aggregateLineas(barco.lineas);
      acc.cajas += agg.cajas;
      acc.kilos += agg.kilos;
      acc.importe += agg.importe;
      return acc;
    },
    { cajas: 0, kilos: 0, importe: 0 }
  );

  const totalServicios = (servicios || []).reduce((acc, s) => acc + (Number(s.importe) || 0), 0);

  const EstadoIcono = ({ exportable = true }) => (
    <TableCell className="w-[9rem] text-right align-middle">
      <div className={`flex justify-end ${exportable ? 'text-green-500' : 'text-red-500'}`}>
        {exportable ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </div>
    </TableCell>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Ventas directas y servicios</CardTitle>
          <Badge
            variant="outline"
            className="border-blue-500/60 px-1.5 py-0 text-[10px] text-blue-600"
          >
            Venta directa
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 pt-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[14rem]">Concepto</TableHead>
              <TableHead className="w-20 text-right">Cajas</TableHead>
              <TableHead className="w-24 text-right">Peso neto</TableHead>
              <TableHead className="w-24 text-right">Precio</TableHead>
              <TableHead className="w-28 text-right">Importe</TableHead>
              <TableHead className="w-[9rem] text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/60 hover:bg-muted/60 font-semibold">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>Venta directa</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{totalVentaDirecta.cajas}</TableCell>
              <TableCell className="text-right">
                {formatDecimalWeight(totalVentaDirecta.kilos)}
              </TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right font-semibold">
                {formatDecimalCurrency(totalVentaDirecta.importe)}
              </TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>

            {ventasDirectasArray.map((barco) => {
              const agg = aggregateLineas(barco.lineas);
              const isExpanded = expandedByBarco[barco.cod] ?? false;
              return (
                <Fragment key={`vd-${barco.cod}`}>
                  <TableRow
                    className="bg-muted/35 hover:bg-muted/35 cursor-pointer font-medium"
                    onClick={() =>
                      setExpandedByBarco((prev) => ({
                        ...prev,
                        [barco.cod]: !isExpanded,
                      }))
                    }
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="text-muted-foreground h-4 w-4" />
                        ) : (
                          <ChevronRight className="text-muted-foreground h-4 w-4" />
                        )}
                        <span className="block">{barco.nombre}</span>
                      </div>
                      <span className="text-muted-foreground text-xs font-normal">
                        {barco.armador?.nombre}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{agg.cajas}</TableCell>
                    <TableCell className="text-right">{formatDecimalWeight(agg.kilos)}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">
                      {formatDecimalCurrency(agg.importe)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-green-500">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs">Exportable</span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded &&
                    barco.lineas.map((linea, idx) => (
                      <TableRow key={`vd-${barco.cod}-${idx}`} className="hover:bg-muted/20">
                        <TableCell className="text-muted-foreground pl-10">
                          {linea.especie}
                        </TableCell>
                        <TableCell className="text-right">{linea.cajas}</TableCell>
                        <TableCell className="text-right">
                          {formatDecimalWeight(parseDecimalValue(linea.kilos))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDecimalCurrency(parseDecimalValue(linea.precio))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDecimalCurrency(calculateImporteFromLinea(linea))}
                        </TableCell>
                        <EstadoIcono exportable />
                      </TableRow>
                    ))}
                </Fragment>
              );
            })}

            {!!servicios.length && (
              <>
                <TableRow className="bg-muted/50 hover:bg-muted/50 font-semibold">
                  <TableCell className="pl-6">Servicios Lonja de Isla Cristina</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">
                    {formatDecimalCurrency(totalServicios)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-green-500">
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">Exportable</span>
                    </div>
                  </TableCell>
                </TableRow>
                {servicios.map((servicio, idx) => (
                  <TableRow key={`srv-${idx}`} className="hover:bg-muted/15">
                    <TableCell className="text-muted-foreground pl-10">
                      {servicio.descripcion}
                      <span className="mt-0.5 block text-xs">
                        Base {formatDecimalCurrency(Number(servicio.base) || 0)} ·{' '}
                        {servicio.porcentaje}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right">
                      {formatDecimalCurrency(Number(servicio.precio) || 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDecimalCurrency(Number(servicio.importe) || 0)}
                    </TableCell>
                    <EstadoIcono exportable />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
