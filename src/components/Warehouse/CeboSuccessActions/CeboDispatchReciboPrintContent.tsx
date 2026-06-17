'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';

interface DispatchDetail {
  product?: { id?: number | string; name?: string; alias?: string } | null;
  netWeight?: number | string | null;
}

interface Supplier {
  id?: number | string;
  name?: string;
  label?: string;
  alias?: string;
}

interface CeboDispatchReciboPrintContentProps {
  dispatchId?: number | string;
  supplier?: Supplier | string | null;
  date?: string | null;
  notes?: string;
  details?: DispatchDetail[];
  className?: string;
}

export default function CeboDispatchReciboPrintContent({
  dispatchId,
  supplier,
  date,
  notes = '',
  details = [],
  className = '',
}: CeboDispatchReciboPrintContentProps) {
  const supplierName = useMemo(() => {
    if (!supplier) return '';
    if (typeof supplier === 'string') return supplier;
    return supplier.name || supplier.label || supplier.alias || '';
  }, [supplier]);

  const formattedDate = useMemo(() => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch {
      return '';
    }
  }, [date]);

  const productsList = useMemo(
    () =>
      details
        .filter((d) => d.product && d.netWeight && parseFloat(String(d.netWeight)) > 0)
        .map((d) => ({
          name: d.product?.name || d.product?.alias || `Producto ${d.product?.id ?? ''}`,
          quantity: parseFloat(String(d.netWeight || 0)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [details]
  );

  const totalQuantity = useMemo(
    () => productsList.reduce((sum, p) => sum + p.quantity, 0),
    [productsList]
  );

  const baseClasses = 'space-y-6 print:px-1 print:py-4 bg-white text-gray-900';
  const padding = className ? '' : 'p-8';

  return (
    <div className={`${padding} ${baseClasses} ${className || ''}`.trim()}>
      <h1 className="mb-6 text-center text-3xl font-bold">NOTA DE SALIDA DE CEBO</h1>
      <div className="mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="font-bold">Numero:</span>
          <span>#{dispatchId}</span>
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
      <div className="mb-6 flex justify-between gap-8">
        <div className="flex-1">
          <div className="mb-3 font-bold">Artículo</div>
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
                <div className="mt-3 border-t pt-2 font-bold">Total</div>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-3 font-bold">Cantidad</div>
          <div className="space-y-2">
            {productsList.length > 0 && (
              <>
                {productsList.map((product, index) => (
                  <div key={index} className="text-sm">
                    {formatDecimalWeight(product.quantity)}
                  </div>
                ))}
                <div className="mt-3 border-t pt-2 font-bold">
                  {formatDecimalWeight(totalQuantity)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-1">
        <div className="font-bold">Notas / Lonja:</div>
        <div className="min-h-[40px] border-b pb-1 text-sm">{notes || ''}</div>
      </div>
    </div>
  );
}
