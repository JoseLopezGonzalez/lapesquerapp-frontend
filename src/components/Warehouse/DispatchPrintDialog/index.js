"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { usePrintElement } from "@/hooks/usePrintElement";

export default function DispatchPrintDialog({
  isOpen,
  onClose,
  dispatchId,
  supplier,
  date,
  notes,
  details = [],
}) {
  const { onPrint } = usePrintElement({
    id: "dispatch-print-content",
    freeSize: true,
  });

  const supplierName = useMemo(() => {
    if (!supplier) return "";
    if (typeof supplier === "string") return supplier;
    return supplier.label || supplier.name || supplier.alias || "";
  }, [supplier]);

  const formattedDate = useMemo(() => {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, "dd/MM/yyyy");
    } catch {
      return "";
    }
  }, [date]);

  const productsList = useMemo(() => {
    return (details || [])
      .filter((d) => d.product)
      .map((d) => ({
        name: d.product?.name || d.product?.alias || "—",
        quantity: parseFloat(d.netWeight || 0),
      }));
  }, [details]);

  const totalQuantity = useMemo(() => {
    return productsList.reduce((sum, p) => sum + p.quantity, 0);
  }, [productsList]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Imprimir Nota de Salida</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col justify-center w-full flex-1 overflow-auto">
          <div className="p-6 space-y-6 bg-white text-gray-900 border border-gray-200 rounded-lg print:bg-white">
            <h1 className="text-3xl font-bold text-center mb-6">NOTA DE SALIDA</h1>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="font-bold">Numero:</span>
                <span>#{dispatchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Proveedor:</span>
                <span>{supplierName || "—"}</span>
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
                      {productsList.map((p, i) => (
                        <div key={i} className="text-sm">
                          {p.name}
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
                      {productsList.map((p, i) => (
                        <div key={i} className="text-sm">
                          {formatDecimalWeight(p.quantity)}
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
              <div className="font-bold">Notas:</div>
              <div className="text-sm min-h-[40px] border-b pb-1">{notes || ""}</div>
            </div>
          </div>
        </div>
        <div id="dispatch-print-content" className="hidden print:block">
          <div className="p-8 space-y-6 print:px-1 print:py-4">
            <h1 className="text-3xl font-bold text-center mb-6">NOTA DE SALIDA</h1>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="font-bold">Numero:</span>
                <span>#{dispatchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Proveedor:</span>
                <span>{supplierName || "—"}</span>
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
                      {productsList.map((p, i) => (
                        <div key={i} className="text-sm">
                          {p.name}
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
                      {productsList.map((p, i) => (
                        <div key={i} className="text-sm">
                          {formatDecimalWeight(p.quantity)}
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
              <div className="font-bold">Notas:</div>
              <div className="text-sm min-h-[40px] border-b pb-1">{notes || ""}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
