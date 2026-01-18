"use client";

/**
 * FloatingUserMenu - Avatar de usuario flotante sobre el contenido
 *
 * Componente flotante que muestra el avatar del usuario sobre el contenido
 * Se mueve con el scroll y desaparece cuando el contenido se desplaza
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { ChatButton } from "@/components/AI/ChatButton";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

  return (
    <div 
      className={cn(
        "relative z-50", // relative dentro del contenedor absoluto
        "pointer-events-auto", // Asegurar que sea clickeable
        "transition-opacity duration-200 ease-out" // Transición suave
      )}
      style={{
        opacity: opacity,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
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
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-lg"
          side="bottom"
          sideOffset={12}
        >
          {/* Header con avatar y info */}
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="rounded-lg text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate font-semibold text-sm">
                  {user?.name || 'Usuario'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Planes */}
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Planes</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Asistente AI */}
          <DropdownMenuGroup>
            <ChatButton asMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span>Asistente AI</span>
              </DropdownMenuItem>
            </ChatButton>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Opciones de cuenta */}
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // TODO: Navegar a perfil
              }}
            >
              <User className="w-4 h-4 mr-2" />
              <span>Perfil</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // TODO: Navegar a cuenta
              }}
            >
              <BadgeCheck className="w-4 h-4 mr-2" />
              <span>Cuenta</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // TODO: Navegar a notificaciones
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              <span>Notificaciones</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                router.push('/admin/settings');
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span>Configuración</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // TODO: Navegar a ayuda
              }}
            >
              <CircleHelp className="w-4 h-4 mr-2" />
              <span>Centro de ayuda</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Tema */}
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="focus:bg-transparent hover:bg-transparent cursor-default"
              onSelect={(e) => e.preventDefault()}
            >
              <span className="mr-2">Tema</span>
              <ThemeToggle className="ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Cerrar sesión */}
          <DropdownMenuItem 
            onClick={user?.logout} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

