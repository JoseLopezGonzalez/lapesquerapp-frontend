'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Package, Scan, Trash2 } from 'lucide-react';
import { getProductOptions } from '@/services/productService';
import { notify } from '@/lib/notifications';
import { parseGs1128Line } from '@/lib/gs1128Parser';
import type { QrValidateResult } from '@/components/Shared/QrScannerWidget';

const QrScannerWidget = dynamic(
  () => import('@/components/Shared/QrScannerWidget').then((m) => ({ default: m.QrScannerWidget })),
  { ssr: false },
);

interface ProductOption {
  value: string | number;
  label: string;
  boxGtin?: string | null;
}

interface ParsedBox {
  productId: string | number;
  productName?: string;
  lot?: string;
  netWeight: number;
  gs1128?: string;
}

interface Step2QRScanProps {
  state: { boxes?: ParsedBox[] };
  addBox: (box: ParsedBox) => void;
  removeBox?: (index: number) => void;
  removeAllBoxes: () => void;
  loadProductOptions?: (token: string) => Promise<unknown>;
}

export default function Step2QRScan({
  state,
  addBox,
  removeBox,
  removeAllBoxes,
  loadProductOptions = getProductOptions,
}: Step2QRScanProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const [productsOptions, setProductsOptions] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCodes, setManualCodes] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoadingProducts(true);
    loadProductOptions(token)
      .then((data) => {
        const raw = Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? []);
        setProductsOptions(
          (raw as Array<{ id?: unknown; value?: unknown; name?: string; label?: string; boxGtin?: string }>).map((p) => ({
            value: (p.id ?? p.value) as string | number,
            label: (p.name ?? p.label ?? '') as string,
            boxGtin: p.boxGtin ?? null,
          })),
        );
      })
      .catch(() => setProductsOptions([]))
      .finally(() => setLoadingProducts(false));
  }, [token, loadProductOptions]);

  // parseGs1128Line (JS) infers boxGtin as required; ProductOption has it optional.
  type Gs1OptionsArg = { value: unknown; label: unknown; boxGtin: unknown }[];

  const validateGs1128 = useCallback(
    (rawValue: string): QrValidateResult => {
      const parsed = parseGs1128Line(rawValue, productsOptions as Gs1OptionsArg);
      return parsed ? { ok: true } : { ok: false, message: 'Código GS1-128 no reconocido' };
    },
    [productsOptions],
  );

  const handleScannedCode = useCallback(
    (rawValue: string) => {
      const code = String(rawValue ?? '').trim();
      if (!code) return;
      const parsed = parseGs1128Line(code, productsOptions as Gs1OptionsArg);
      if (parsed) addBox(parsed);
    },
    [productsOptions, addBox],
  );

  const handleScannerError = (message: string) => {
    notify.error({ title: message || 'No se pudo acceder a la cámara.' }, { duration: 800 });
    setScannerOpen(false);
  };

  const handleManualCodesSubmit = () => {
    const lines = manualCodes
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      notify.error({ title: 'Añade al menos un código' }, { duration: 1200 });
      return;
    }

    let added = 0;
    let invalid = 0;

    lines.forEach((line) => {
      const parsed = parseGs1128Line(line, productsOptions as Gs1OptionsArg);
      if (parsed) {
        addBox(parsed);
        added += 1;
      } else {
        invalid += 1;
      }
    });

    if (added > 0) {
      notify.success(
        {
          title: added === 1 ? 'Caja añadida' : `${added} cajas añadidas`,
          description: invalid > 0 ? `${invalid} códigos no se pudieron leer.` : undefined,
        },
        { duration: 1800 },
      );
      setManualCodes('');
      return;
    }

    notify.error(
      {
        title: 'No se pudo leer ningún código',
        description: 'Revisa el formato GS1-128 e inténtalo de nuevo.',
      },
      { duration: 1800 },
    );
  };

  const boxes = state.boxes ?? [];

  return (
    <div className="flex min-h-0 w-full max-w-[420px] flex-1 flex-col gap-4">
      <div className="w-full shrink-0">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => setScannerOpen(true)}
          disabled={loadingProducts}
        >
          <Scan className="mr-2 h-4 w-4" />
          Escanear con cámara
        </Button>
      </div>

      <div className={`${isDev ? 'block' : 'hidden md:block'} w-full shrink-0 space-y-2`}>
        <Textarea
          value={manualCodes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setManualCodes(e.target.value)}
          placeholder="Pega uno o varios códigos GS1-128, uno por línea"
          className="min-h-24 resize-none"
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleManualCodesSubmit}
          disabled={loadingProducts}
        >
          Añadir códigos pegados
        </Button>
      </div>

      {scannerOpen && (
        <QrScannerWidget
          onScan={handleScannedCode}
          onClose={() => setScannerOpen(false)}
          onError={handleScannerError}
          validate={validateGs1128}
          statusText="Apunta al código de la caja"
          successText="Caja añadida"
          formats={['code_128', 'qr_code']}
        />
      )}

      <div className="flex shrink-0 items-center justify-between">
        <span className="text-sm font-medium">Cajas añadidas ({boxes.length})</span>
        {boxes.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={removeAllBoxes}>
            Eliminar todo
          </Button>
        )}
      </div>

      <div className="border-muted-foreground/25 bg-muted/20 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-dashed">
        {boxes.length === 0 ? (
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
            <div className="bg-muted border-border rounded-full border p-4">
              <Package className="text-muted-foreground h-14 w-14" strokeWidth={1.5} />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">Ninguna caja añadida</h3>
              <p className="text-muted-foreground max-w-[280px] text-sm">
                Escanea códigos con el lector para añadir cajas.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-border min-h-0 flex-1 divide-y overflow-auto">
            {boxes.map((box, idx) => (
              <li key={idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  {box.productName ?? box.productId} — {Number(box.netWeight).toFixed(2)} kg
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
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
