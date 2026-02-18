'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';

function roundToTwoDecimals(val) {
  return Math.round(val * 100) / 100;
}

function parseGs1128Line(line, productsOptions) {
  const scannedCode = String(line).trim();
  let match = scannedCode.match(/01(\d{14})3100(\d{6})10(.+)/);
  let isPounds = false;
  if (!match) {
    match = scannedCode.match(/01(\d{14})3200(\d{6})10(.+)/);
    isPounds = true;
  }
  if (!match) return null;
  const [, gtin, weightStr, lot] = match;
  let netWeight = parseFloat(weightStr) / 100;
  if (isPounds) netWeight = netWeight * 0.453592;
  netWeight = roundToTwoDecimals(netWeight);
  const product = productsOptions.find((p) => p.boxGtin === gtin);
  if (!product) return null;
  return {
    productId: product.value,
    productName: product.label,
    lot,
    netWeight,
    gs1128: scannedCode,
  };
}

export default function Step2QRScan({
  state,
  addBox,
  removeAllBoxes,
}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [productsOptions, setProductsOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoadingProducts(true);
    getProductOptions(token)
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setProductsOptions(
          raw.map((p) => ({
            value: p.id ?? p.value,
            label: p.name ?? p.label ?? '',
            boxGtin: p.boxGtin ?? null,
          }))
        );
      })
      .catch(() => setProductsOptions([]))
      .finally(() => setLoadingProducts(false));
  }, [token]);

  const handleAddCode = () => {
    const code = manualCode?.trim();
    if (!code) return;
    const parsed = parseGs1128Line(code, productsOptions);
    if (!parsed) {
      notify.error({
        title: 'Código no válido',
        description:
          'Formato esperado: 01(GTIN)3100(peso kg) o 3200(peso lb) y 10(lote). O no hay producto con ese GTIN.',
      });
      return;
    }
    addBox(parsed);
    setManualCode('');
    notify.success({ title: 'Caja añadida', description: `${parsed.productName} - ${parsed.netWeight} kg` });
  };

  const boxes = state.boxes ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="gs1-code">Código GS1-128 (pegado o escaneado)</Label>
        <div className="flex gap-2">
          <Input
            id="gs1-code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCode())}
            placeholder="01...3100...10..."
            disabled={loadingProducts}
          />
          <Button type="button" onClick={handleAddCode} disabled={loadingProducts || !manualCode?.trim()}>
            Añadir
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Cajas añadidas ({boxes.length})</span>
        {boxes.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={removeAllBoxes}>
            Eliminar todo
          </Button>
        )}
      </div>

      {boxes.length > 0 && (
        <ul className="border rounded-md divide-y max-h-48 overflow-auto">
          {boxes.map((box, idx) => (
            <li key={idx} className="px-3 py-2 text-sm flex justify-between">
              <span>
                {box.productName ?? box.productId} — {Number(box.netWeight).toFixed(2)} kg
                {box.lot ? ` — ${box.lot}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
