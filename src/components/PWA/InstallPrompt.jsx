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
import { cn } from "@/lib/utils";

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

  // Si está dentro de un contenedor con bg-primary, ajustar estilos
  const isPrimaryContext = className?.includes('bg-primary') || className?.includes('bg-transparent');
  
  return (
    <div className={className || ''}>
      <Button
        onClick={handleInstall}
        size={variant === "default" ? "lg" : "sm"}
        variant={variant === "default" ? "default" : variant}
        className={cn(
          "w-full",
          isPrimaryContext && "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        )}
      >
        <Download className="w-4 h-4 mr-2" />
        Instalar
      </Button>
      {showDismissButton && (
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      )}
    </div>
  );
}

// InstallPromptBanner se movió a un archivo separado
// Ver: src/components/PWA/InstallPromptBanner.jsx

