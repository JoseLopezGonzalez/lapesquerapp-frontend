'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePalletAttachments } from '@/hooks/pallets/usePalletAttachments';
import { palletAttachmentService } from '@/services/domain/pallets/palletAttachmentService';
import { PalletLightboxDialog } from './PalletLightboxDialog';
import { PalletUploadDialog } from './PalletUploadDialog';
import { PalletQuickImagesDialog } from './PalletQuickImagesDialog';
import { cn } from '@/lib/utils';

const STRIP_LIMIT = 3;

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
  /** Si false, los thumbnails y el botón añadir no son clicables (actores externos). */
  canInteract?: boolean;
}

export function PalletImageStrip({ palletId, canInteract = true }: PalletImageStripProps) {
  const { attachments, total, isLoading } = usePalletAttachments(palletId, {
    perPage: STRIP_LIMIT,
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    setGalleryOpen(true);
  };

  const visible = attachments.slice(0, STRIP_LIMIT);
  const overflow = total - visible.length;

  return (
    <>
      <div className="flex items-center gap-1.5 px-4 pb-3 pt-1">
        {/* Loading: two skeleton thumbs to reserve height */}
        {isLoading && (
          <>
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />
          </>
        )}

        {/* Loaded: clickable thumbnails → open lightbox */}
        {!isLoading &&
          visible.map((att, i) => (
            <button
              key={att.id}
              type="button"
              className={cn(
                'relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md transition-transform',
                canInteract
                  ? 'cursor-pointer hover:scale-[1.06] hover:ring-2 hover:ring-primary/40'
                  : 'cursor-default'
              )}
              onClick={canInteract ? () => openLightbox(i) : undefined}
              disabled={!canInteract}
              title={canInteract ? 'Ver imagen' : undefined}
            >
              <AuthThumb palletId={palletId} attachmentId={att.id} />
            </button>
          ))}

        {/* Overflow badge → opens lightbox at first hidden image */}
        {!isLoading && overflow > 0 && (
          <button
            type="button"
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground transition-colors',
              canInteract ? 'cursor-pointer hover:bg-muted/70' : 'cursor-default'
            )}
            onClick={canInteract ? () => openLightbox(STRIP_LIMIT) : undefined}
            disabled={!canInteract}
            title={canInteract ? `Ver ${overflow} imágenes más` : undefined}
          >
            +{overflow}
          </button>
        )}

        {/* Add button — always shown when canInteract, same size as thumbnails */}
        {canInteract && (
          <button
            type="button"
            className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 text-muted-foreground/50 transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-primary"
            onClick={() => setUploadOpen(true)}
            title="Añadir foto"
          >
            {attachments.length === 0 && !isLoading ? (
              <Camera className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {canInteract && (
        <>
          {/* Lightbox: opens at clicked thumbnail index */}
          <PalletLightboxDialog
            palletId={palletId}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
            initialIndex={lightboxIndex}
          />

          {/* Upload: solo dialog for adding a new image */}
          <PalletUploadDialog
            palletId={palletId}
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onUploadSuccess={handleUploadSuccess}
          />

          {/* Gallery: full view shown after a successful upload */}
          <PalletQuickImagesDialog
            palletId={palletId}
            open={galleryOpen}
            onOpenChange={setGalleryOpen}
          />
        </>
      )}
    </>
  );
}
