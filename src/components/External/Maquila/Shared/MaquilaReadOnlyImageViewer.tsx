'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GenericImageAttachment {
  id: number;
}

interface MaquilaReadOnlyImageViewerProps<A extends GenericImageAttachment> {
  attachments: A[];
  getBlobUrl: (attachmentId: number) => Promise<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

/**
 * Visor de imágenes de solo lectura, genérico por entidad (palets, producciones, recepciones —
 * cualquier colección de adjuntos con endpoints download/thumbnail). Sin edición de notas ni
 * borrado: el portal de maquila nunca escribe sobre adjuntos (403 fail-closed en backend).
 */
export function MaquilaReadOnlyImageViewer<A extends GenericImageAttachment>({
  attachments,
  getBlobUrl,
  open,
  onOpenChange,
  initialIndex = 0,
}: MaquilaReadOnlyImageViewerProps<A>) {
  const [index, setIndex] = useState(initialIndex);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const current = attachments[index];

  useEffect(() => {
    if (!current) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setSrc(null);
    getBlobUrl(current.id).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [current, getBlobUrl]);

  if (!open) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[95vh] flex-col gap-0 overflow-hidden bg-zinc-950 p-0"
        size="5xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {current ? `Imagen ${index + 1} de ${attachments.length}` : 'Imágenes'}
        </DialogTitle>

        <div className="relative flex min-h-[400px] flex-1 items-center justify-center">
          {!src && <Loader2 className="h-10 w-10 animate-spin text-white/40" />}
          {src && (
            <img
              src={src}
              alt=""
              className="max-h-[80vh] max-w-full object-contain"
              draggable={false}
            />
          )}

          {attachments.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIndex((i) => (i - 1 + attachments.length) % attachments.length)}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIndex((i) => (i + 1) % attachments.length)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {current && (
          <div className="border-t border-white/10 bg-zinc-950 px-4 py-2.5 text-center text-xs text-white/60">
            {index + 1} / {attachments.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
