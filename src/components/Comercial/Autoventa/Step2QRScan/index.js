'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';
import { parseGs1128Line } from '@/lib/gs1128Parser';

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
    const raw = manualCode?.trim();
    if (!raw) return;

    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    if (lines.length === 1) {
      const code = lines[0];
      let match = code.match(/01(\d{14})3100(\d{6})10(.+)/);
      if (!match) match = code.match(/01(\d{14})3200(\d{6})10(.+)/);
      if (!match) {
        notify.error({
          title: 'Código no válido',
          description: 'Se espera formato GS1-128 con 3100 (kg) o 3200 (libras). Revisa el código escaneado.',
        });
        return;
      }
      const [, gtin] = match;
      const product = productsOptions.find((p) => p.boxGtin === gtin);
      if (!product) {
        notify.error({
          title: 'Producto no encontrado',
          description: `No hay ningún producto con GTIN ${gtin}. Comprueba que el código corresponda a un producto dado de alta.`,
        });
        return;
      }
      const parsed = parseGs1128Line(code, productsOptions);
      if (parsed) {
        addBox(parsed);
        setManualCode('');
        notify.success({ title: 'Caja añadida', description: 'La caja se ha añadido correctamente desde el código escaneado.' });
      }
      return;
    }

    const parsedBoxes = [];
    const failedLines = [];
    for (const line of lines) {
      const parsed = parseGs1128Line(line, productsOptions);
      if (parsed) parsedBoxes.push(parsed);
      else failedLines.push(line);
    }

    if (parsedBoxes.length === 0) {
      notify.error({
        title: 'Códigos no procesados',
        description: 'Ninguno de los códigos pudo ser procesado. Verifica que tengan formato 01(GTIN)3100/3200(peso)10(lote) y que los productos existan.',
      });
      return;
    }
    parsedBoxes.forEach((box) => addBox(box));
    setManualCode('');
    if (failedLines.length > 0) {
      notify.error({
        title: 'Algunos códigos no reconocidos',
        description: `${failedLines.length} ${failedLines.length === 1 ? 'código no' : 'códigos no'} fueron reconocidos. Revisa el formato (01+GTIN+3100/3200+peso+10+lote) y que los productos existan.`,
      });
    } else {
      notify.success({
        title: 'Cajas agregadas',
        description: `Se han añadido ${parsedBoxes.length} cajas desde los códigos GS1-128.`,
      });
    }
  };

  const boxes = state.boxes ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="gs1-code">Código GS1-128 (pegado o escaneado; varios códigos, uno por línea)</Label>
        <div className="flex gap-2">
          <Input
            id="gs1-code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCode())}
            placeholder="01(GTIN)3100(peso)10(lote) o 3200 para libras"
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
