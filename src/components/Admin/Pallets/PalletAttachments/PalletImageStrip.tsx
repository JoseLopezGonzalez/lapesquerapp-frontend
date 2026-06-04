'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { palletAttachmentService } from '@/services/domain/pallets/palletAttachmentService';

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
    palletAttachmentService.getBlobUrl(palletId, attachmentId).then((url) => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      urlRef.current = url;
      setSrc(url);
    }).catch(() => {});
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
}

export function PalletImageStrip({ palletId }: PalletImageStripProps) {
  const { attachments, total, isLoading } = usePalletAttachments(palletId, {
    perPage: STRIP_LIMIT,
  });

  if (isLoading) {
    return (
      <div className="flex gap-1.5 px-4 pb-3 pt-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-md" />
        ))}
      </div>
    );
  }

  if (attachments.length === 0) return null;

  const visible = attachments.slice(0, STRIP_LIMIT);
  const overflow = total - visible.length;

  return (
    <div className="flex items-center gap-1.5 px-4 pb-3 pt-1">
      {visible.map((att) => (
        <div key={att.id} className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
          <AuthThumb palletId={palletId} attachmentId={att.id} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
          +{overflow}
        </div>
      )}
      <ImageIcon className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
    </div>
  );
}
