"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Package, Layers } from 'lucide-react';
import { formatDecimalWeight, formatDecimal } from '@/helpers/formats/numbers/formatNumbers';

export default function ReceptionSummaryDialog({ 
    isOpen, 
    onClose, 
    pallets = [], 
    prices = [],
    onPriceChange = null // Callback: (productId, lot, price) => void
}) {
    const [groupByProduct, setGroupByProduct] = useState(false);

    // Convert prices array to map for quick lookup
    const pricesMap = useMemo(() => {
        const map = new Map();
        prices.forEach(price => {
            if (price.product?.id) {
                // Handle both empty string and undefined/null lots
                const lot = price.lot || '';
                const key = `${price.product.id}-${lot}`;
                map.set(key, price.price);
            }
        });
        return map;
    }, [prices]);

    // Extract product+lot summary from all pallets
    const productLotSummary = useMemo(() => {
        const summaryMap = new Map();
        
        pallets.forEach((item) => {
            const pallet = item.pallet;
            (pallet?.boxes || []).forEach(box => {
                if (box.product?.id) {
                    const productId = box.product.id;
                    const productName = box.product.name || box.product.alias || 'Producto sin nombre';
                    const lot = box.lot || '';
                    const key = groupByProduct ? `${productId}` : `${productId}-${lot}`;
                    
                    if (!summaryMap.has(key)) {
                        summaryMap.set(key, {
                            productId: productId,
                            productName: productName,
                            lot: lot,
                            boxesCount: 0,
                            totalNetWeight: 0,
                            lots: new Set(),
                            prices: [],
                        });
                    }
                    
                    const entry = summaryMap.get(key);
                    entry.boxesCount += 1;
                    entry.totalNetWeight += parseFloat(box.netWeight || 0);
                    
                    // Add lot to set (even if empty string)
                    entry.lots.add(lot || '');
                    
                    // Get price for this product+lot combination
                    if (!groupByProduct) {
                        const priceKey = `${productId}-${lot}`;
                        const price = pricesMap.get(priceKey);
                        if (price !== undefined && price !== null && !entry.prices.includes(price)) {
                            entry.prices.push(price);
                        }
                    }
                }
            });
        });

        // Convert to array and handle grouped products
        const summary = Array.from(summaryMap.values()).map(entry => {
            // For grouped products, collect all prices from different lots
            if (groupByProduct) {
                const allLots = Array.from(entry.lots);
                entry.prices = allLots
                    .map(lot => {
                        const priceKey = `${entry.productId}-${lot || ''}`;
                        return pricesMap.get(priceKey);
                    })
                    .filter(p => p !== undefined && p !== null);
            }
            
            return {
                ...entry,
                lots: Array.from(entry.lots).filter(l => l !== ''), // Filter empty lots for display
            };
        });

        return summary.sort((a, b) => a.productName.localeCompare(b.productName));
    }, [pallets, pricesMap, groupByProduct]);

    // Calculate totals for products table
    const productsTotals = useMemo(() => {
        const totalBoxes = productLotSummary.reduce((sum, item) => sum + item.boxesCount, 0);
        const totalWeight = productLotSummary.reduce((sum, item) => sum + item.totalNetWeight, 0);
        return { totalBoxes, totalWeight };
    }, [productLotSummary]);

    // Calculate totals for pallets table
    const palletsTotals = useMemo(() => {
        const totalBoxes = pallets.reduce((sum, item) => {
            const pallet = item.pallet;
            return sum + (pallet.numberOfBoxes || pallet.boxes?.length || 0);
        }, 0);
        const totalWeight = pallets.reduce((sum, item) => {
            const pallet = item.pallet;
            return sum + (pallet.netWeight || 0);
        }, 0);
        return { totalBoxes, totalWeight };
    }, [pallets]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Resumen de Recepción</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="products" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="products" className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Productos por Lotes
                        </TabsTrigger>
                        <TabsTrigger value="pallets" className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Listado de Palets
                        </TabsTrigger>
                    </TabsList>

                    {/* Products by Lots Tab */}
                    <TabsContent value="products" className="flex-1 flex flex-col overflow-hidden mt-4">
                        <div className="mb-4 flex items-center space-x-2">
                            <Checkbox
                                id="group-by-product"
                                checked={groupByProduct}
                                onCheckedChange={setGroupByProduct}
                            />
                            <Label 
                                htmlFor="group-by-product" 
                                className="text-sm font-normal cursor-pointer"
                            >
                                Agrupar todos los lotes del mismo producto
                            </Label>
                        </div>

                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        {!groupByProduct && <TableHead>Lote</TableHead>}
                                        {groupByProduct && <TableHead>Lotes</TableHead>}
                                        <TableHead className="text-right">Cajas</TableHead>
                                        <TableHead className="text-right">Peso Neto</TableHead>
                                        <TableHead className="text-right">Precio (€/kg)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productLotSummary.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={groupByProduct ? 5 : 6} className="text-center text-muted-foreground py-8">
                                                No hay productos en esta recepción
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        productLotSummary.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium align-top">{item.productName}</TableCell>
                                                {!groupByProduct ? (
                                                    <TableCell className="font-mono text-sm align-top">{item.lot || '(sin lote)'}</TableCell>
                                                ) : (
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.lots.length > 0 ? (
                                                                item.lots.map((lot, idx) => (
                                                                    <span key={idx} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                                                        {lot}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">(sin lote)</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right align-top">{item.boxesCount}</TableCell>
                                                <TableCell className="text-right align-top">{formatDecimalWeight(item.totalNetWeight)}</TableCell>
                                                <TableCell className="text-right align-top">
                                                    <div className="flex justify-end">
                                                        {!groupByProduct ? (
                                                            // When not grouped, show editable input for single price
                                                            (() => {
                                                                const priceKey = `${item.productId}-${item.lot || ''}`;
                                                                const priceFromMap = pricesMap.get(priceKey);
                                                                // Convert to string for input, handling both number and string
                                                                const displayPrice = priceFromMap !== undefined && priceFromMap !== null 
                                                                    ? (typeof priceFromMap === 'number' ? priceFromMap.toString() : String(priceFromMap))
                                                                    : '';
                                                                
                                                                return (
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={displayPrice}
                                                                        onChange={(e) => {
                                                                            const newPrice = e.target.value;
                                                                            if (onPriceChange) {
                                                                                onPriceChange(item.productId, item.lot || '', newPrice);
                                                                            }
                                                                        }}
                                                                        className="w-24 text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                );
                                                            })()
                                                        ) : (
                                                            // When grouped, show read-only multiple prices
                                                            item.prices.length > 0 ? (
                                                                item.prices.length === 1 ? (
                                                                    <span>{formatDecimal(item.prices[0])}</span>
                                                                ) : (
                                                                    <div className="text-sm text-right">
                                                                        {item.prices.map((price, idx) => (
                                                                            <div key={idx}>{formatDecimal(price)}</div>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {productLotSummary.length > 0 && (
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell className="font-semibold">TOTALES</TableCell>
                                            {!groupByProduct && <TableCell></TableCell>}
                                            {groupByProduct && <TableCell></TableCell>}
                                            <TableCell className="text-right font-semibold">{productsTotals.totalBoxes}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalWeight(productsTotals.totalWeight)}</TableCell>
                                            <TableCell className="text-right"></TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Pallets List Tab */}
                    <TabsContent value="pallets" className="flex-1 flex flex-col overflow-hidden mt-4">
                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                        <TableHead>Productos</TableHead>
                                        <TableHead>Lotes</TableHead>
                                        <TableHead className="text-right">Cajas</TableHead>
                                        <TableHead className="text-right">Peso Neto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pallets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No hay pallets en esta recepción
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pallets.map((item, index) => {
                                            const pallet = item.pallet;
                                            
                                            // Get unique products and lots from boxes
                                            const productsSet = new Set();
                                            const lotsSet = new Set();
                                            (pallet?.boxes || []).forEach(box => {
                                                if (box.product?.id) {
                                                    const productName = box.product.name || box.product.alias || 'Producto sin nombre';
                                                    productsSet.add(productName);
                                                    
                                                    const lot = box.lot || '';
                                                    if (lot) {
                                                        lotsSet.add(lot);
                                                    }
                                                }
                                            });
                                            
                                            const products = Array.from(productsSet).sort();
                                            const lots = Array.from(lotsSet).sort();
                                            
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">
                                                        {pallet.id ? `#${pallet.id}` : `Nuevo ${index + 1}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.observations || (
                                                            <span className="text-muted-foreground italic">Sin observaciones</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {products.length === 0 ? (
                                                                <span className="text-sm text-muted-foreground">No hay productos</span>
                                                            ) : (
                                                                products.map((productName, productIdx) => (
                                                                    <div key={productIdx} className="text-sm font-medium">
                                                                        {productName}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {lots.length === 0 ? (
                                                                <span className="text-sm text-muted-foreground">(sin lote)</span>
                                                            ) : (
                                                                lots.map((lot, lotIdx) => (
                                                                    <div key={lotIdx} className="text-sm font-mono text-muted-foreground">
                                                                        {lot}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right align-top">
                                                        {pallet.numberOfBoxes || pallet.boxes?.length || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right align-top">
                                                        {formatDecimalWeight(pallet.netWeight || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                    {pallets.length > 0 && (
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell className="font-semibold">TOTALES</TableCell>
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                            <TableCell className="text-right font-semibold">{palletsTotals.totalBoxes}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatDecimalWeight(palletsTotals.totalWeight)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

