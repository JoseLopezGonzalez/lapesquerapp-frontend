'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { calculateImporteFromLinea } from '@/exportHelpers/common';
import { normalizeText } from '@/helpers/formats/texts';
import { barcos as barcosAsoc } from '../../ListadoComprasAsocPuntaDelMoral/exportData';
import { buildAsocServiciosCalculados } from '@/exportHelpers/portFeeRepercusion';

export default function AsocExportPreview({ document, applyFullTasaPescaRepercusion = true }) {
  const {
    details: { tipoSubasta },
    tables,
  } = document;
  const isVentaDirecta = tipoSubasta === 'M1 M1';
  const isSubasta = tipoSubasta === 'T2 Arrastre';

  const subastasGroupedByBarco = tables.subastas.reduce((acc, item) => {
    if (!acc[item.barco]) {
      acc[item.barco] = { nombre: item.barco, matricula: item.matricula, lineas: [] };
    }
    acc[item.barco].lineas.push(item);
    return acc;
  }, {});
  const subastas = Object.values(subastasGroupedByBarco);

  const importeTotalCalculado = tables.subastas.reduce(
    (acc, linea) => acc + calculateImporteFromLinea(linea, 'pesoNeto'),
    0
  );

  const servicios = buildAsocServiciosCalculados(
    applyFullTasaPescaRepercusion,
    importeTotalCalculado
  );

  const isConvertibleBarco = (matricula) =>
    barcosAsoc.some((b) => normalizeText(b.matricula) === normalizeText(matricula));

  return (
    <div className="space-y-4">
      {isVentaDirecta &&
        subastas.map((barco, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{barco.nombre}</CardTitle>
                <div className="flex items-center gap-2">
                  {isConvertibleBarco(barco.matricula) ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-green-500 bg-green-900 text-green-200"
                    >
                      <Check className="h-3.5 w-3.5" /> Exportable
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-red-500 bg-red-900 text-red-200"
                    >
                      <X className="h-3.5 w-3.5" /> No exportable
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
                    <TableHead className="text-right">Peso Neto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barco.lineas.map((linea, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{linea.cajas}</TableCell>
                      <TableCell>{linea.especie}</TableCell>
                      <TableCell className="text-right">{linea.pesoNeto}</TableCell>
                      <TableCell className="text-right">{linea.precio} €</TableCell>
                      <TableCell className="text-right font-medium">
                        {calculateImporteFromLinea(linea, 'pesoNeto')} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      {isSubasta && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cajas</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Peso Neto</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.subastas.map((linea, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{linea.cajas}</TableCell>
                    <TableCell>{linea.especie}</TableCell>
                    <TableCell className="text-right">{linea.pesoNeto}</TableCell>
                    <TableCell className="text-right">{linea.precio} €</TableCell>
                    <TableCell className="text-right font-medium">
                      {calculateImporteFromLinea(linea, 'pesoNeto')} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {servicios.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cod</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicios.map((s, i) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{s.codigo}</TableCell>
                    <TableCell>{s.descripcion}</TableCell>
                    <TableCell className="text-right">{s.unidades}</TableCell>
                    <TableCell className="text-right">{s.precio.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-medium">
                      {s.importe.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
