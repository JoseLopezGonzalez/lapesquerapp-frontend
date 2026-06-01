'use client';

/**
 * InstallPromptBanner - Prompt intrusivo para instalación PWA
 *
 * Mobile: Mini dialog modal en la parte inferior que bloquea la interacción
 * Desktop: Notificación en la esquina inferior derecha
 *
 * Se muestra solo cuando las condiciones de estrategia se cumplen.
 *
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import * as React from 'react';
import { usePWAInstallStrategy } from '@/hooks/use-pwa-install-strategy';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { InstallPrompt } from './InstallPrompt';
import { InstallGuideIOS } from './InstallGuideIOS';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { appShortName } from '@/configs/branding';

export function InstallPromptBanner() {
  const {
    shouldShow,
    canShow,
    markAsShown,
    markAsDismissed,
    isIOS: isIOSFromStrategy,
  } = usePWAInstallStrategy();
  const { canInstall, isIOS, install } = usePWAInstall();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // No mostrar si no cumple condiciones
  if (!shouldShow || !canShow) {
    return null;
  }

  // Mobile: Notificación en el top (igual estilo que desktop pero arriba)
  if (isMobile) {
    return (
      <div
        className={cn(
          'bg-primary text-primary-foreground border-primary-foreground/10 fixed top-4 right-4 left-4 z-50 rounded-xl border shadow-2xl',
          MOBILE_SAFE_AREAS.TOP,
          'animate-in slide-in-from-top duration-300'
        )}
      >
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="bg-primary-foreground/15 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Download className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-primary-foreground mb-1 text-base leading-tight font-semibold">
                  Instala {appShortName}
                </h3>
                <p className="text-primary-foreground/75 text-sm leading-relaxed">
                  Añade la app a tu pantalla de inicio para acceso rápido y una mejor experiencia
                </p>
              </div>
            </div>
            <Button
              onClick={markAsDismissed}
              variant="ghost"
              size="icon"
              className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/15 -mt-1 -mr-1 h-8 w-8 shrink-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          <div>
            {isIOS ? (
              <>
                <Button
                  onClick={() => setOpen(true)}
                  size="default"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-10 w-full text-sm font-medium shadow-sm"
                >
                  Cómo instalar
                </Button>
                <InstallGuideIOS open={open} onOpenChange={setOpen} />
              </>
            ) : canInstall ? (
              <InstallPrompt
                onDismiss={markAsDismissed}
                className="w-full"
                showDismissButton={false}
                variant="default"
              />
            ) : (
              // Fallback: Si no hay canInstall, mostrar botón con instrucciones
              <Button
                onClick={() => setOpen(true)}
                size="default"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-10 w-full text-sm font-medium shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Cómo instalar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Notificación en la esquina inferior derecha
  return (
    <div
      className={cn(
        'bg-primary text-primary-foreground border-primary-foreground/10 fixed right-4 bottom-4 z-50 w-96 rounded-xl border shadow-2xl',
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="bg-primary-foreground/15 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Download className="text-primary-foreground h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-primary-foreground mb-1 text-base leading-tight font-semibold">
                Instala {appShortName}
              </h3>
              <p className="text-primary-foreground/75 text-sm leading-relaxed">
                Añade la app a tu escritorio para acceso rápido y una mejor experiencia
              </p>
            </div>
          </div>
          <Button
            onClick={markAsDismissed}
            variant="ghost"
            size="icon"
            className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/15 -mt-1 -mr-1 h-8 w-8 shrink-0 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        <div>
          {isIOS ? (
            <>
              <Button
                onClick={() => setOpen(true)}
                size="default"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-10 w-full text-sm font-medium shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Instalar
              </Button>
              <InstallGuideIOS open={open} onOpenChange={setOpen} />
            </>
          ) : canInstall ? (
            <Button
              onClick={async () => {
                const success = await install();
                if (success) {
                  markAsDismissed();
                }
              }}
              size="default"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-10 w-full text-sm font-medium shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
          ) : (
            // Fallback: Si no hay canInstall, mostrar botón con instrucciones
            <>
              <Button
                onClick={() => setOpen(true)}
                size="default"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-10 w-full text-sm font-medium shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Cómo instalar
              </Button>
              <InstallGuideIOS open={open} onOpenChange={setOpen} hideIfNotIOS={false} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
