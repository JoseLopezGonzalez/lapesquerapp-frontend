"use client";

/**
 * InstallPrompt - Componente para instalación PWA en Android/Chrome
 * 
 * Muestra un botón de instalación cuando la PWA está disponible para instalar.
 * Solo aparece en Android/Chrome (no en iOS).
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import * as React from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function InstallPrompt({ 
  onDismiss, 
  className,
  variant = "default",
  showDismissButton = true
}) {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  // No mostrar si ya está instalada, es iOS (iOS usa InstallGuideIOS), o fue desestimado
  if (isInstalled || isIOS || !canInstall || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setDismissed(true);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // NO guardar en localStorage (el usuario quiere que vuelva a aparecer)
    onDismiss?.();
  };

  return (
    <div className={`bg-primary text-primary-foreground p-4 rounded-lg shadow-lg ${className || ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            Instalar PesquerApp
          </h3>
          <p className="text-xs opacity-90">
            Añade la app a tu pantalla de inicio para acceso rápido
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            variant={variant === "default" ? "secondary" : variant}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="shrink-0 h-8 w-8 p-0 hover:bg-white/20"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// InstallPromptBanner se movió a un archivo separado
// Ver: src/components/PWA/InstallPromptBanner.jsx

