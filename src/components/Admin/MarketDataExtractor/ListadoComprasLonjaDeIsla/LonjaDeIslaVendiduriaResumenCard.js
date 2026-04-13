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
import { formatDecimalCurrency, formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { sumLonjaDeIslaResumenRows } from '@/exportHelpers/lonjaDeIslaVendiduriaResumen';

export default function LonjaDeIslaVendiduriaResumenCard({ rows }) {
    if (!rows || rows.length === 0) return null;

    const totals = sumLonjaDeIslaResumenRows(rows);

    return (
        <Card className="border-muted">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumen por vendiduría</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                    Cajas, peso neto e importe agrupados por vendiduría (y venta directa si aplica).
                </p>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendiduría</TableHead>
                            <TableHead className="text-right">Cajas</TableHead>
                            <TableHead className="text-right">Peso neto</TableHead>
                            <TableHead className="text-right">Importe</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.cod}>
                                <TableCell className="font-medium">{row.nombre}</TableCell>
                                <TableCell className="text-right">{row.cajas}</TableCell>
                                <TableCell className="text-right">
                                    {formatDecimalWeight(row.kilos)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatDecimalCurrency(row.importe)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="border-t-2 font-semibold bg-muted/40">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">{totals.cajas}</TableCell>
                            <TableCell className="text-right">
                                {formatDecimalWeight(totals.kilos)}
                            </TableCell>
                            <TableCell className="text-right">
                                {formatDecimalCurrency(totals.importe)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
