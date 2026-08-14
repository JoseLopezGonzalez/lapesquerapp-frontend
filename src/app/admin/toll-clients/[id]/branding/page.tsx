'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/notifications';
import { useTollClientBrandingAdmin } from '@/hooks/toll-clients/useTollClientBrandingAdmin';
import type { UseMutationResult } from '@tanstack/react-query';

interface BrandingSlotProps {
  title: string;
  description: string;
  imageUrl: string | null | undefined;
  uploadMutation: UseMutationResult<void, unknown, File>;
  deleteMutation: UseMutationResult<void, unknown, void>;
}

function BrandingSlot({
  title,
  description,
  imageUrl,
  uploadMutation,
  deleteMutation,
}: BrandingSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/30 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-contain" />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-1.5">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs">Sin imagen</span>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {imageUrl ? 'Reemplazar' : 'Subir imagen'}
          </Button>
          {imageUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
              disabled={isBusy}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Quitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TollClientBrandingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Branding del portal de maquila (login-banner + logo) — solo staff. No forma parte del CRUD
 * genérico de EntityClient (subida multipart no encaja en el sistema de fields declarativo),
 * por eso es una página propia enganchada vía `viewRoute` en entitiesConfig.catalog.ts.
 */
export default function TollClientBrandingPage({ params }: TollClientBrandingPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const {
    tollClient,
    isLoading,
    error,
    uploadLoginBanner,
    deleteLoginBanner,
    uploadLogo,
    deleteLogo,
  } = useTollClientBrandingAdmin(id);

  const portalUrl =
    tollClient && typeof window !== 'undefined'
      ? `${window.location.origin}/portal/${tollClient.slug}`
      : null;

  const handleCopy = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      notify.success('URL copiada');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/toll-clients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {isLoading ? <Skeleton className="h-6 w-48" /> : `Branding — ${tollClient?.name}`}
          </h1>
          <p className="text-muted-foreground text-sm">
            Imágenes de la pantalla de acceso y cabecera del portal de este cliente de maquila.
          </p>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {tollClient && !isLoading && (
        <>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">URL del portal para este cliente</p>
                <p className="truncate text-sm font-medium">{portalUrl}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-1.5"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BrandingSlot
              title="Banner de login"
              description="Imagen grande a la izquierda del formulario de acceso (máx. 8 MB)."
              imageUrl={tollClient.loginBannerUrl}
              uploadMutation={uploadLoginBanner}
              deleteMutation={deleteLoginBanner}
            />
            <BrandingSlot
              title="Logo"
              description="Logo pequeño en la cabecera del portal ya autenticado (máx. 5 MB)."
              imageUrl={tollClient.logoUrl}
              uploadMutation={uploadLogo}
              deleteMutation={deleteLogo}
            />
          </div>
        </>
      )}
    </div>
  );
}
