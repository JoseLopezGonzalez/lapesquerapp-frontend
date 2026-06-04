// PalletLabel.js
import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';
import { buildPalletQrPayload } from '@/lib/qr/buildPalletQrPayload';

const PalletLabel = ({ pallet }) => {
  // Usar valores del backend si están disponibles, sino calcular desde cajas disponibles
  // Asegurar que las cajas tengan la estructura correcta (product en lugar de article)
  const normalizedBoxes = (pallet.boxes || []).map((box) => {
    // Si la caja tiene article pero no product, convertir article a product
    if (box.article && !box.product) {
      return {
        ...box,
        product: box.article,
      };
    }
    return box;
  });

  const availableBoxes = getAvailableBoxes(normalizedBoxes);
  const availableBoxCount = getAvailableBoxesCount(pallet);
  const availableNetWeight = getAvailableNetWeight(pallet);
  const qrPayload = buildPalletQrPayload(pallet);

  // Obtener productos únicos de las cajas disponibles
  const uniqueProducts = [
    ...new Set(
      availableBoxes.filter((b) => b.product && b.product.name).map((b) => b.product.name)
    ),
  ];

  // Obtener lotes únicos de las cajas disponibles
  const uniqueLots = [...new Set(availableBoxes.filter((b) => b.lot).map((b) => b.lot))];

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden bg-white p-0 text-neutral-900 dark:bg-white dark:text-neutral-900">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-3xl font-bold">Palet #{pallet.id}</CardTitle>
          {pallet.orderId && (
            <p className="text-sm text-gray-600 dark:text-gray-600">
              Pedido vinculado: #{pallet.orderId}
            </p>
          )}
        </div>
        {qrPayload && (
          <div className="shrink-0 bg-white p-1" aria-label={`QR ${qrPayload}`}>
            <QRCode value={qrPayload} size={72} level="M" />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm print:space-y-1 print:text-xs">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex max-h-[18mm] w-full flex-col overflow-hidden">
              <p className="mb-1 font-semibold text-gray-600 dark:text-gray-600">Productos:</p>
              {uniqueProducts.length > 0 ? (
                <ul className="w-full list-inside list-disc space-y-0.5">
                  {uniqueProducts.map((name) => (
                    <li
                      key={name}
                      className="w-full truncate font-medium text-neutral-900 dark:text-neutral-900"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-600">Sin productos</p>
              )}
            </div>
            <div className="flex max-h-[26mm] w-full flex-col overflow-hidden">
              <p className="mb-1 font-semibold text-gray-600 dark:text-gray-600">Lotes:</p>
              {uniqueLots.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {uniqueLots.map((lot) => (
                    <Badge
                      key={lot}
                      variant="outline"
                      className="border-gray-400 bg-white text-xs text-neutral-900 dark:border-gray-400 dark:bg-white dark:text-neutral-900"
                    >
                      {lot}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-600">Sin lotes</p>
              )}
            </div>
            {pallet.observations && (
              <div className="flex max-h-[13mm] w-full flex-col overflow-hidden">
                <p className="mb-1 font-semibold text-gray-600 dark:text-gray-600">
                  Observaciones:
                </p>
                <p className="h-full w-full flex-1 truncate rounded-md bg-gray-100 dark:bg-gray-100">
                  {pallet.observations}
                </p>
              </div>
            )}
          </div>
          <Separator className="my-1 bg-gray-300 dark:bg-gray-300" />
          <div className="grid grid-cols-11 gap-2 text-center">
            <div className="col-span-5 text-neutral-900 dark:text-neutral-900">
              <p className="text-lg font-medium">{availableBoxCount} cajas</p>
            </div>
            <Separator orientation="vertical" className="h-8 bg-gray-300 dark:bg-gray-300" />
            <div className="col-span-5 text-neutral-900 dark:text-neutral-900">
              <p className="text-lg font-medium">{formatDecimalWeight(availableNetWeight)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PalletLabel;
