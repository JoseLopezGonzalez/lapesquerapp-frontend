"use client";

/**
 * InstallGuideIOS - Guía de instalación para iOS
 * 
 * Muestra instrucciones paso a paso para instalar la PWA en iOS,
 * ya que iOS no tiene el evento beforeinstallprompt nativo.
 * 
 * Referencia: docs/mobile-adaptation/00-PLAN-GENERAL.md
 */

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, Share2, Plus, CheckCircle } from "lucide-react";
import { isIOSDevice, isPWAInstalled } from "@/hooks/use-pwa-install";

export function InstallGuideIOS({ 
  trigger,
  open,
  onOpenChange,
  hideIfNotIOS = true
}) {
  const [isOpen, setIsOpen] = React.useState(open || false);
  const isIOS = React.useMemo(() => isIOSDevice(), []);
  const isInstalled = React.useMemo(() => isPWAInstalled(), []);

  // No mostrar si no es iOS o ya está instalada (solo si hideIfNotIOS es true)
  if (hideIfNotIOS && (!isIOS || isInstalled)) {
    return null;
  }

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Instalar PesquerApp
          </SheetTitle>
          <SheetDescription>
            Añade la app a tu pantalla de inicio en iOS
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Paso 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                1
              </div>
              <h3 className="font-semibold">Toca el botón "Compartir"</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Busca el icono de compartir <Share2 className="w-4 h-4 inline-block mx-1" /> 
              en la barra de herramientas del navegador (parte inferior en Safari)
            </p>
            <div className="ml-11 bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Share2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Botón Compartir</span>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                2
              </div>
              <h3 className="font-semibold">Selecciona "Añadir a pantalla de inicio"</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              En el menú que aparece, desplázate y selecciona la opción 
              <strong> "Añadir a pantalla de inicio"</strong> o <strong>"Añadir a inicio"</strong>
            </p>
            <div className="ml-11 bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-3 text-sm">
                <Plus className="w-5 h-5 text-primary" />
                <span className="font-medium">Añadir a pantalla de inicio</span>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                3
              </div>
              <h3 className="font-semibold">Confirma la instalación</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Revisa el nombre y el icono de la app, luego toca 
              <strong> "Añadir"</strong> para confirmar
            </p>
            <div className="ml-11 bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">Confirmar instalación</span>
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> Una vez instalada, la app aparecerá en tu pantalla de inicio 
              y se abrirá como una aplicación independiente.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <SheetClose asChild>
            <Button variant="outline">
              Entendido
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * InstallButtonIOS - Botón simple para abrir la guía
 */
export function InstallButtonIOS({ children, className }) {
  const [open, setOpen] = React.useState(false);
  const isIOS = React.useMemo(() => isIOSDevice(), []);
  const isInstalled = React.useMemo(() => isPWAInstalled(), []);

  if (!isIOS || isInstalled) {
    return null;
  }

  return (
    <InstallGuideIOS
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button 
          onClick={() => setOpen(true)}
          className={className}
          variant="outline"
        >
          {children || (
            <>
              <Download className="w-4 h-4 mr-2" />
              Instalar app
            </>
          )}
        </Button>
      }
    />
  );
}

