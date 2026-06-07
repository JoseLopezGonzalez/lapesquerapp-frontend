'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { palletAttachmentService } from '@/services/domain/pallets/palletAttachmentService';
import { cn } from '@/lib/utils';

const STRIP_LIMIT = 4;

interface ThumbProps {
  palletId: number | string;
  attachmentId: number;
}

function AuthThumb({ palletId, attachmentId }: ThumbProps) {
  const [src, setSrc] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    palletAttachmentService
      .getBlobUrl(palletId, attachmentId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        urlRef.current = url;
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [palletId, attachmentId]);

  if (!src) return <Skeleton className="h-full w-full rounded-md" />;

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full rounded-md object-cover"
      draggable={false}
    />
  );
}

interface PalletImageStripProps {
  palletId: number | string;
  /** Abre el dialog del palet en el tab de imágenes */
  onClickStrip?: () => void;
}

export function PalletImageStrip({ palletId, onClickStrip }: PalletImageStripProps) {
  const { attachments, total, isLoading } = usePalletAttachments(palletId, {
    perPage: STRIP_LIMIT,
  });

  if (isLoading) return null;

  // No images: show "Añadir foto" affordance if interactive
  if (attachments.length === 0) {
    if (!onClickStrip) return null;
    return (
      <button
        type="button"
        className="flex w-full items-center gap-1.5 px-4 pb-3 pt-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        onClick={onClickStrip}
      >
        <Camera className="h-3.5 w-3.5 flex-shrink-0" />
        Añadir foto
      </button>
    );
  }

  const visible = attachments.slice(0, STRIP_LIMIT);
  const overflow = total - visible.length;

  const inner = (
    <>
      {visible.map((att) => (
        <div
          key={att.id}
          className={cn(
            'relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md',
            onClickStrip && 'transition-transform group-hover:scale-[1.04]'
          )}
        >
          <AuthThumb palletId={palletId} attachmentId={att.id} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
          +{overflow}
        </div>
      )}
      <ImageIcon className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
    </>
  );

  if (onClickStrip) {
    return (
      <button
        type="button"
        className="group flex w-full items-center gap-1.5 px-4 pb-3 pt-1 transition-opacity hover:opacity-80"
        onClick={onClickStrip}
        title="Ver imágenes"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-4 pb-3 pt-1">{inner}</div>
  );
}
