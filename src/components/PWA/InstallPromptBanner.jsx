"use client";

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

import * as React from "react";
import { usePWAInstallStrategy } from "@/hooks/use-pwa-install-strategy";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { InstallPrompt } from "./InstallPrompt";
import { InstallGuideIOS } from "./InstallGuideIOS";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function InstallPromptBanner() {
  const { 
    shouldShow, 
    canShow, 
    markAsShown, 
    markAsDismissed,
    isIOS: isIOSFromStrategy
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
          "fixed top-4 left-4 right-4 z-50 bg-primary text-primary-foreground rounded-xl shadow-2xl border border-primary-foreground/10",
          MOBILE_SAFE_AREAS.TOP,
          "animate-in slide-in-from-top duration-300"
        )}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15 shrink-0 mt-0.5">
                <Download className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-semibold text-base text-primary-foreground leading-tight mb-1">
                  Instala PesquerApp
                </h3>
                <p className="text-sm text-primary-foreground/75 leading-relaxed">
                  Añade la app a tu pantalla de inicio para acceso rápido y una mejor experiencia
                </p>
              </div>
            </div>
            <Button
              onClick={markAsDismissed}
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/15 rounded-full -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          <div>
            {isIOS ? (
              <>
                <Button
                  onClick={() => setOpen(true)}
                  size="default"
                  className="w-full h-10 text-sm font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
                >
                  Cómo instalar
                </Button>
                <InstallGuideIOS
                  open={open}
                  onOpenChange={setOpen}
                />
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
                className="w-full h-10 text-sm font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
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
        "fixed bottom-4 right-4 z-50 w-96 bg-primary text-primary-foreground rounded-xl shadow-2xl border border-primary-foreground/10",
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15 shrink-0 mt-0.5">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-semibold text-base leading-tight mb-1 text-primary-foreground">
                Instala PesquerApp
              </h3>
              <p className="text-sm text-primary-foreground/75 leading-relaxed">
                Añade la app a tu escritorio para acceso rápido y una mejor experiencia
              </p>
            </div>
          </div>
          <Button
            onClick={markAsDismissed}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/15 rounded-full -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        <div>
          {isIOS ? (
            <>
              <Button
                onClick={() => setOpen(true)}
                size="default"
                className="w-full h-10 text-sm font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
              <InstallGuideIOS
                open={open}
                onOpenChange={setOpen}
              />
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
              className="w-full h-10 text-sm font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
          ) : (
            // Fallback: Si no hay canInstall, mostrar botón con instrucciones
            <>
              <Button
                onClick={() => setOpen(true)}
                size="default"
                className="w-full h-10 text-sm font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Cómo instalar
              </Button>
              <InstallGuideIOS
                open={open}
                onOpenChange={setOpen}
                hideIfNotIOS={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

