"use client";

import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from "date-fns";
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

export default function ReceptionPrintDialog({ 
    isOpen, 
    onClose,
    receptionId,
    supplier,
    date,
    notes,
    details = [], // For 'lines' mode
    pallets = [], // For 'pallets' mode
    creationMode = null
}) {
    // Get supplier name from options or object
    const supplierName = useMemo(() => {
        if (!supplier) return '';
        if (typeof supplier === 'string') {
            return '';
        }
        return supplier.label || supplier.name || supplier.alias || '';
    }, [supplier]);

    // Format date
    const formattedDate = useMemo(() => {
        if (!date) return '';
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            return format(dateObj, 'dd/MM/yyyy');
        } catch {
            return '';
        }
    }, [date]);

    // Process products and quantities based on creation mode
    const productsList = useMemo(() => {
        if (creationMode === 'pallets') {
            // Extract products from pallets
            const productMap = new Map();
            
            pallets.forEach((item) => {
                const pallet = item.pallet;
                (pallet?.boxes || []).forEach(box => {
                    if (box.product?.id) {
                        const productId = box.product.id;
                        const productName = box.product.name || box.product.alias || 'Producto sin nombre';
                        const lot = box.lot || '';
                        const key = `${productId}-${lot}`;
                        const netWeight = parseFloat(box.netWeight || 0);
                        
                        if (!productMap.has(key)) {
                            productMap.set(key, {
                                name: productName,
                                lot: lot,
                                quantity: 0
                            });
                        }
                        const entry = productMap.get(key);
                        entry.quantity += netWeight;
                    }
                });
            });
            
            return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Extract products from details
            return details
                .filter(detail => detail.product && detail.netWeight && parseFloat(detail.netWeight) > 0)
                .map(detail => {
                    // Find product name from productOptions would require passing it as prop
                    // For now, we'll use a placeholder or try to get it from detail
                    const productName = detail.productName || detail.product?.name || detail.product?.alias || `Producto ${detail.product}`;
                    return {
                        name: productName,
                        lot: detail.lot || '',
                        quantity: parseFloat(detail.netWeight || 0)
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [creationMode, details, pallets]);

    // Calculate total
    const totalQuantity = useMemo(() => {
        return productsList.reduce((sum, product) => sum + product.quantity, 0);
    }, [productsList]);

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-2xl print:max-w-none print:p-0 print:border-0 print:shadow-none">
                    <div id="reception-print-content" className="p-6 print:p-8 space-y-6">
                        {/* Title */}
                        <h1 className="text-3xl font-bold text-center print:text-4xl mb-6">NOTA DE ENTRADA</h1>
                        
                        {/* Header Info */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between">
                                <span className="font-bold">Numero:</span>
                                <span>#{receptionId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Proveedor:</span>
                                <span>{supplierName || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">Fecha:</span>
                                <span>{formattedDate}</span>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="flex justify-between gap-8 mb-6">
                            {/* Left: Articles */}
                            <div className="flex-1">
                                <div className="font-bold mb-3">Artículo</div>
                                <div className="space-y-2">
                                    {productsList.length === 0 ? (
                                        <div className="text-muted-foreground">No hay productos</div>
                                    ) : (
                                        <>
                                            {productsList.map((product, index) => (
                                                <div key={index} className="text-sm">
                                                    {product.name}
                                                </div>
                                            ))}
                                            <div className="font-bold mt-3 pt-2 border-t">Total</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right: Quantities */}
                            <div className="text-right">
                                <div className="font-bold mb-3">Cantidad</div>
                                <div className="space-y-2">
                                    {productsList.length > 0 && (
                                        <>
                                            {productsList.map((product, index) => (
                                                <div key={index} className="text-sm">
                                                    {formatDecimalWeight(product.quantity)}
                                                </div>
                                            ))}
                                            <div className="font-bold mt-3 pt-2 border-t">
                                                {formatDecimalWeight(totalQuantity)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1 mt-6">
                            <div className="font-bold">Notas / Lonja:</div>
                            <div className="text-sm min-h-[40px] border-b pb-1">
                                {notes || ''}
                            </div>
                        </div>
                    </div>

                    {/* Print Button - Hidden when printing */}
                    <div className="flex justify-end gap-2 mt-4 print:hidden">
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #reception-print-content,
                    #reception-print-content * {
                        visibility: visible;
                    }
                    #reception-print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                    }
                    @page {
                        margin: 20mm;
                        size: A4;
                    }
                }
            `}</style>
        </>
    );
}

