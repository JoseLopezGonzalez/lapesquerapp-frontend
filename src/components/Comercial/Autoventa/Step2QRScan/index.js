'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Scan } from 'lucide-react';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';
import { parseGs1128Line } from '@/lib/gs1128Parser';

const Step2CameraScanner = dynamic(() => import('../Step2CameraScanner'), { ssr: false });

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
  const [scannerOpen, setScannerOpen] = useState(false);

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

  const handleScannedCode = (rawValue) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;
    const parsed = parseGs1128Line(code, productsOptions);
    if (parsed) {
      addBox(parsed);
      notify.success({ title: 'Caja añadida', description: 'La caja se ha añadido correctamente desde el código escaneado.' });
      setScannerOpen(false);
    } else {
      notify.error({
        title: 'Código no válido',
        description: 'Se espera formato GS1-128 con 3100 (kg) o 3200 (libras). Revisa el código escaneado.',
      });
    }
  };

  const handleScannerError = (message) => {
    notify.error({ title: 'Cámara', description: message || 'No se pudo acceder a la cámara.' });
    setScannerOpen(false);
  };

  const boxes = state.boxes ?? [];

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <Label htmlFor="gs1-code">Código GS1-128 (pegado o escaneado; varios códigos, uno por línea)</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2 flex-1">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => setScannerOpen(true)}
            disabled={loadingProducts}
            className="shrink-0"
          >
            <Scan className="h-4 w-4 mr-2" />
            Escanear con cámara
          </Button>
        </div>
      </div>

      {scannerOpen && (
        <Step2CameraScanner
          onScan={handleScannedCode}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Cajas añadidas ({boxes.length})</span>
        {boxes.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={removeAllBoxes}>
            Eliminar todo
          </Button>
        )}
      </div>

      {boxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 w-full min-h-[min(260px,40vh)] rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 py-10 px-6">
          <div className="rounded-full bg-muted border border-border p-4">
            <Package className="h-14 w-14 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Ninguna caja añadida</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Escanea o pega códigos GS1-128 para añadir cajas.
            </p>
          </div>
        </div>
      ) : (
        <ul className="rounded-md border divide-y max-h-48 overflow-auto">
          {boxes.map((box, idx) => (
            <li key={idx} className="px-3 py-2 text-sm flex justify-between">
              <span>
                {box.productName ?? box.productId} — {Number(box.netWeight).toFixed(2)} kg
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
