"use client";

/**
 * InstallPromptBanner - Banner inferior para instalación PWA
 * 
 * Banner que aparece en la parte inferior de la pantalla en mobile.
 * Se muestra solo cuando las condiciones de estrategia se cumplen.
 * 
 * Estrategia:
 * - Banner inferior fijo
 * - Visible solo en mobile
 * - Respeta safe areas iOS
 * - Se puede cerrar (solo esta sesión)
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import * as React from "react";
import { usePWAInstallStrategy } from "@/hooks/use-pwa-install-strategy";
import { InstallPrompt } from "./InstallPrompt";
import { InstallGuideIOS } from "./InstallGuideIOS";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";

export function InstallPromptBanner() {
  const { 
    shouldShow, 
    canShow, 
    markAsShown, 
    markAsDismissed,
    isIOS 
  } = usePWAInstallStrategy();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // Marcar como mostrado cuando se renderiza
  React.useEffect(() => {
    if (shouldShow && canShow) {
      markAsShown();
    }
  }, [shouldShow, canShow, markAsShown]);

  // No mostrar si no cumple condiciones o no es mobile
  if (!shouldShow || !canShow || !isMobile) {
    return null;
  }

  // Para iOS, mostrar guía en Sheet cuando se toque el banner
  if (isIOS) {
    return (
      <>
        {/* Banner para iOS */}
        <div 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg",
            "border-t border-primary-foreground/20",
            MOBILE_SAFE_AREAS.BOTTOM,
            "animate-in slide-in-from-bottom duration-300"
          )}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Instala PesquerApp
                </p>
                <p className="text-xs opacity-90 mt-0.5">
                  Acceso rápido desde tu pantalla de inicio
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setOpen(true)}
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                >
                  Cómo instalar
                </Button>
                <Button
                  onClick={markAsDismissed}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet con guía de instalación para iOS */}
        <InstallGuideIOS
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
              // Opcional: marcar como cerrado al cerrar el sheet
              // markAsDismissed();
            }
          }}
        />
      </>
    );
  }

  // Para Android/Chrome, mostrar Install Prompt con botón de instalación
  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        MOBILE_SAFE_AREAS.BOTTOM,
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className="bg-primary text-primary-foreground shadow-lg border-t border-primary-foreground/20">
        <div className="container mx-auto px-4 py-3">
          <InstallPrompt
            onDismiss={markAsDismissed}
            variant="secondary"
            className="mb-0 bg-transparent text-primary-foreground p-0 border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

