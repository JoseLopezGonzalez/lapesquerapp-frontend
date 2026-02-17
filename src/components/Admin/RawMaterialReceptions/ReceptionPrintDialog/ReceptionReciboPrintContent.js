'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

/**
 * Contenido imprimible de la Nota de Entrada (recibo).
 * Compartido entre ReceptionPrintDialog y pantalla de éxito (impresión directa).
 */
export default function ReceptionReciboPrintContent({
  receptionId,
  supplier,
  date,
  notes = '',
  details = [],
  pallets = [],
  creationMode = null,
  className = '',
}) {
  const supplierName = useMemo(() => {
    if (!supplier) return '';
    if (typeof supplier === 'string') return '';
    return supplier.label || supplier.name || supplier.alias || '';
  }, [supplier]);

  const formattedDate = useMemo(() => {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'dd/MM/yyyy');
    } catch {
      return '';
    }
  }, [date]);

  const productsList = useMemo(() => {
    if (creationMode === 'pallets') {
      const productMap = new Map();
      pallets.forEach((item) => {
        const pallet = item.pallet;
        (pallet?.boxes || []).forEach((box) => {
          if (box.product?.id) {
            const productId = box.product.id;
            const productName = box.product.name || box.product.alias || 'Producto sin nombre';
            const lot = box.lot || '';
            const key = `${productId}-${lot}`;
            const netWeight = parseFloat(box.netWeight || 0);
            if (!productMap.has(key)) {
              productMap.set(key, { name: productName, lot, quantity: 0 });
            }
            const entry = productMap.get(key);
            entry.quantity += netWeight;
          }
        });
      });
      return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    return details
      .filter((d) => d.product && d.netWeight && parseFloat(d.netWeight) > 0)
      .map((d) => ({
        name: d.productName || d.product?.name || d.product?.alias || `Producto ${d.product}`,
        lot: d.lot || '',
        quantity: parseFloat(d.netWeight || 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [creationMode, details, pallets]);

  const totalQuantity = useMemo(
    () => productsList.reduce((sum, p) => sum + p.quantity, 0),
    [productsList]
  );

  const baseClasses = 'space-y-6 print:px-1 print:py-4 bg-white text-gray-900';
  const padding = className ? '' : 'p-8';
  return (
    <div className={`${padding} ${baseClasses} ${className || ''}`.trim()}>
      <h1 className="text-3xl font-bold text-center mb-6">NOTA DE ENTRADA</h1>
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
      <div className="flex justify-between gap-8 mb-6">
        <div className="flex-1">
          <div className="font-bold mb-3">Artículo</div>
          <div className="space-y-2">
            {productsList.length === 0 ? (
              <div className="text-gray-500">No hay productos</div>
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
      <div className="space-y-1 mt-6">
        <div className="font-bold">Notas / Lonja:</div>
        <div className="text-sm min-h-[40px] border-b pb-1">{notes || ''}</div>
      </div>
    </div>
  );
}
