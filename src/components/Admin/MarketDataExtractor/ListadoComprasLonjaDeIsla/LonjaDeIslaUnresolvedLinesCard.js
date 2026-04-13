'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { parseDecimalValue } from '@/exportHelpers/common';

function getRecommendation(reason) {
    if (reason === 'barco_not_found') {
        return 'Revisar nombre/cod del barco o añadirlo al catálogo.';
    }
    if (reason === 'vendiduria_not_found') {
        return 'Asignar codVendiduria al barco en catálogo.';
    }
    return 'Revisar datos del documento.';
}

export default function LonjaDeIslaUnresolvedLinesCard({ unresolvedLines = [] }) {
    if (!unresolvedLines.length) return null;

    return (
        <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    Líneas sin clasificar ({unresolvedLines.length})
                </CardTitle>
                <p className="text-sm text-amber-700/80 font-normal">
                    Estas líneas no se pudieron asignar a vendiduría o venta directa.
                </p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Barco (doc)</TableHead>
                            <TableHead>Cod</TableHead>
                            <TableHead>Especie</TableHead>
                            <TableHead className="text-right">Kilos</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Acción recomendada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unresolvedLines.map((item, idx) => (
                            <TableRow key={`${item.reason}-${item.venta?.codBarco || 'sin-cod'}-${idx}`}>
                                <TableCell className="font-medium">{item.venta?.barco || '-'}</TableCell>
                                <TableCell>{item.venta?.codBarco || '-'}</TableCell>
                                <TableCell>{item.venta?.especie || '-'}</TableCell>
                                <TableCell className="text-right">
                                    {formatDecimalWeight(parseDecimalValue(item.venta?.kilos))}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatDecimalCurrency(parseDecimalValue(item.venta?.precio))}
                                </TableCell>
                                <TableCell>
                                    {item.reason === 'barco_not_found'
                                        ? 'Barco no encontrado'
                                        : item.reason === 'vendiduria_not_found'
                                            ? 'Vendiduría no encontrada'
                                            : 'No clasificada'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {getRecommendation(item.reason)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
