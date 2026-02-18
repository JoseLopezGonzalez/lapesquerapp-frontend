'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Package, Scan, Trash2 } from 'lucide-react';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';
import { parseGs1128Line } from '@/lib/gs1128Parser';

const Step2CameraScanner = dynamic(() => import('../Step2CameraScanner'), { ssr: false });

export default function Step2QRScan({
  state,
  addBox,
  removeBox,
  removeAllBoxes,
}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [productsOptions, setProductsOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const lastScannedRef = useRef({ code: '', at: 0 });
  const DEBOUNCE_MS = 2500;

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

  const handleScannedCode = (rawValue) => {
    const code = String(rawValue ?? '').trim();
    if (!code) return;
    const now = Date.now();
    const { code: lastCode, at: lastAt } = lastScannedRef.current;
    if (code === lastCode && now - lastAt < DEBOUNCE_MS) return;
    lastScannedRef.current = { code, at: now };

    const parsed = parseGs1128Line(code, productsOptions);
    if (parsed) {
      addBox(parsed);
      notify.success({ title: 'Caja añadida' }, { duration: 800 });
    } else {
      notify.error({ title: 'Código no válido' }, { duration: 800 });
    }
  };

  const handleScannerError = (message) => {
    notify.error(
      { title: message || 'No se pudo acceder a la cámara.' },
      { duration: 800 }
    );
    setScannerOpen(false);
  };

  const boxes = state.boxes ?? [];

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full gap-4 max-w-[420px]">
      <div className="w-full shrink-0">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => setScannerOpen(true)}
          disabled={loadingProducts}
        >
          <Scan className="h-4 w-4 mr-2" />
          Escanear con cámara
        </Button>
      </div>

      {scannerOpen && (
        <Step2CameraScanner
          onScan={handleScannedCode}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
        />
      )}

      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-medium">Cajas añadidas ({boxes.length})</span>
        {boxes.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={removeAllBoxes}>
            Eliminar todo
          </Button>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 overflow-hidden">
        {boxes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full min-h-0 py-10 px-6">
            <div className="rounded-full bg-muted border border-border p-4">
              <Package className="h-14 w-14 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Ninguna caja añadida</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Escanea códigos QR con el lector para añadir cajas.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex-1 min-h-0 overflow-auto divide-y divide-border">
          {boxes.map((box, idx) => (
            <li key={idx} className="px-3 py-2 text-sm flex justify-between items-center gap-2">
              <span className="min-w-0 flex-1">
                {box.productName ?? box.productId} — {Number(box.netWeight).toFixed(2)} kg
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeBox?.(idx)}
                aria-label="Eliminar esta caja"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          </ul>
        )}
      </div>
    </div>
  );
}
