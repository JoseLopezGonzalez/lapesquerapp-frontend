"use client";

/**
 * FloatingUserMenu - Avatar de usuario flotante sobre el contenido
 *
 * Componente flotante que muestra el avatar del usuario sobre el contenido
 * Se mueve con el scroll y desaparece cuando el contenido se desplaza
 * 
 * En mobile, abre un Dialog de pantalla completa con opciones de usuario
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  BadgeCheck,
  Bell,
  LogOut,
  Settings,
  Sparkles,
  MessageSquare,
  CircleHelp,
  User,
  X,
} from "lucide-react";
import { ChatButton } from "@/components/AI/ChatButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";

/**
 * FloatingUserMenu - Avatar flotante de usuario
 *
 * @param {object} props
 * @param {object} props.user - Objeto usuario con name, email, logout, avatar
 * @param {React.RefObject<HTMLElement>} props.scrollContainerRef - Ref del contenedor scrollable
 */
export function FloatingUserMenu({ user, scrollContainerRef }) {
  const router = useRouter();
  const [scrollY, setScrollY] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  // Iniciales del usuario (2 caracteres en mayúscula)
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Detectar scroll del contenedor usando la ref proporcionada
  React.useEffect(() => {
    const mainElement = scrollContainerRef?.current;
    if (!mainElement) return;

    const handleScroll = () => {
      setScrollY(mainElement.scrollTop);
    };

    // Establecer valor inicial
    handleScroll();
    
    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContainerRef]);

  // Calcular opacidad basada en el scroll (desaparece gradualmente)
  const opacity = React.useMemo(() => {
    if (scrollY < 50) return 1;
    if (scrollY > 150) return 0;
    // Interpolación lineal entre 50px y 150px
    return 1 - (scrollY - 50) / 100;
  }, [scrollY]);

  // Items del menú con el mismo tamaño que NavigationSheet
  const menuItems = [
    {
      icon: Sparkles,
      label: "Planes",
      onClick: () => {
        // TODO: Navegar a planes
        setDialogOpen(false);
      },
    },
    {
      icon: MessageSquare,
      label: "Asistente AI",
      isChatButton: true,
    },
    {
      icon: User,
      label: "Perfil",
      onClick: () => {
        // TODO: Navegar a perfil
        setDialogOpen(false);
      },
    },
    {
      icon: BadgeCheck,
      label: "Cuenta",
      onClick: () => {
        // TODO: Navegar a cuenta
        setDialogOpen(false);
      },
    },
    {
      icon: Bell,
      label: "Notificaciones",
      onClick: () => {
        // TODO: Navegar a notificaciones
        setDialogOpen(false);
      },
    },
    {
      icon: Settings,
      label: "Configuración",
      onClick: () => {
        router.push('/admin/settings');
        setDialogOpen(false);
      },
    },
    {
      icon: CircleHelp,
      label: "Centro de ayuda",
      onClick: () => {
        // TODO: Navegar a ayuda
        setDialogOpen(false);
      },
    },
  ];

  return (
    <>
      <div 
        className={cn(
          "relative z-50",
          "pointer-events-auto",
          "transition-opacity duration-200 ease-out"
        )}
        style={{
          opacity: opacity,
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          className={cn(
            "h-12 w-12 shrink-0 rounded-full",
            "bg-background/95 backdrop-blur-md",
            "border border-border",
            "shadow-lg shadow-black/10",
            "hover:bg-background hover:shadow-xl",
            "transition-all duration-200",
            "active:scale-95"
          )}
          aria-label="Menú de usuario"
        >
          <Avatar className="h-11 w-11 ring-2 ring-background/50">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={cn(
            "!fixed !inset-0 !z-50 !m-0 !h-screen !w-screen !max-w-none !rounded-none",
            "!translate-x-0 !translate-y-0", // Sin transformación de centrado
            "flex flex-col p-0",
            "[&>button]:hidden", // Ocultar botón de cerrar por defecto
            MOBILE_SAFE_AREAS.BOTTOM
          )}
        >
          <DialogHeader className="flex-shrink-0 px-4 pt-2 pb-2">
            <DialogTitle className="sr-only">Menú de usuario</DialogTitle>
            <DialogDescription className="sr-only">
              Menú con opciones de cuenta, configuración y preferencias del usuario
            </DialogDescription>
          </DialogHeader>

          {/* Header con avatar y info */}
          <div className="flex-shrink-0 px-4 py-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-lg text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate font-semibold text-lg">
                  {user?.name || 'Usuario'}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
              <div className="scale-150 mr-2">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                
                if (item.isChatButton) {
                  return (
                    <ChatButton key={item.label} asMenuItem>
                      <button
                        className={cn(
                          "flex items-center gap-3 w-full",
                          "min-h-[56px] px-4 py-3",
                          "text-base text-left",
                          "hover:bg-accent active:bg-accent/80",
                          "transition-colors duration-150",
                          "border-b border-border/50 last:border-b-0"
                        )}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                      </button>
                    </ChatButton>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center gap-3 w-full",
                      "min-h-[56px] px-4 py-3",
                      "text-base text-left",
                      "hover:bg-accent active:bg-accent/80",
                      "transition-colors duration-150",
                      "border-b border-border/50 last:border-b-0"
                    )}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>


            {/* Cerrar sesión */}
            <div className="px-4 py-2">
              <button
                onClick={() => {
                  user?.logout?.();
                  setDialogOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full",
                  "min-h-[56px] px-4 py-3",
                  "text-base font-medium text-left",
                  "text-destructive",
                  "border-2 border-destructive/20 rounded-lg",
                  "bg-destructive/5",
                  "hover:bg-destructive/10 hover:border-destructive/30",
                  "active:bg-destructive/15 active:border-destructive/40",
                  "transition-all duration-150"
                )}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                <span className="flex-1">Cerrar Sesión</span>
              </button>
            </div>

            {/* Separador */}
            <div className="border-t my-2" />

            {/* Botón cerrar */}
            <div className="px-4 py-3">
              <Button
                variant="secondary"
                onClick={() => setDialogOpen(false)}
                className="w-full min-h-[56px] text-base"
              >
                <X className="h-6 w-6 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

