'use client';

/**
 * TopBar - Barra superior para mobile
 *
 * Barra superior fija para dispositivos móviles con:
 * - Logo (izquierda)
 * - Botón menú (izquierda) - Abre Sheet con navegación completa
 * - Usuario/Dropdown (derecha)
 *
 * Referencia: docs/mobile-adaptation/implementaciones/01-LAYOUT-NAVEGACION.md
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOBILE_HEIGHTS, MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { NAVBAR_LOGO } from '@/configs/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BadgeCheck,
  Bell,
  LogOut,
  Settings,
  Sparkles,
  MessageSquare,
  CircleHelp,
  User,
} from 'lucide-react';
import { NavigationSheet } from '@/components/Admin/Layout/NavigationSheet';
import { ChatButton } from '@/components/AI/ChatButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * TopBar - Componente principal de barra superior
 *
 * @param {object} props
 * @param {Function} props.onMenuClick - Callback cuando se clickea el botón menú (deprecated, usar open/onOpenChange)
 * @param {boolean} props.sheetOpen - Si el sheet de navegación está abierto
 * @param {Function} props.onSheetOpenChange - Callback cuando cambia el estado del sheet
 * @param {object} props.user - Objeto usuario con name, email, logout
 * @param {Array} props.navigationItems - Items de navegación principal
 * @param {Array} props.navigationManagersItems - Items de gestores
 * @param {Array} props.apps - Array de apps para AppSwitcher
 * @param {boolean} props.loading - Si está cargando (para AppSwitcher)
 */
export function TopBar({
  onMenuClick,
  sheetOpen = false,
  onSheetOpenChange,
  user,
  navigationItems = [],
  navigationManagersItems = [],
  apps = [],
  loading = false,
}) {
  const router = useRouter();

  // Iniciales del usuario (2 caracteres en mayúscula)
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50',
        'bg-background border-b',
        'shadow-sm',
        MOBILE_SAFE_AREAS.TOP,
        'animate-in slide-in-from-top duration-300'
      )}
    >
      <div
        className={cn(
          'container mx-auto',
          'flex items-center justify-between',
          'px-4 py-3',
          MOBILE_HEIGHTS.INPUT // h-12 para altura consistente
        )}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img src={NAVBAR_LOGO} alt="PesquerApp" className="h-10 w-auto object-contain" />
        </div>

        {/* Right: Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-lg" // Más ancho y redondeado
            side="bottom"
            sideOffset={8}
          >
            {/* Header con avatar y info */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar className="h-10 w-10 rounded-lg after:rounded-lg">
                  <AvatarImage src={user?.avatar} alt={user?.name} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{user?.name || 'Usuario'}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email || ''}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Planes */}
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4" />
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
                  <MessageSquare className="mr-2 h-4 w-4" />
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
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  // TODO: Navegar a cuenta
                }}
              >
                <BadgeCheck className="mr-2 h-4 w-4" />
                <span>Cuenta</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  // TODO: Navegar a notificaciones
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notificaciones</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  router.push('/admin/settings');
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  // TODO: Navegar a ayuda
                }}
              >
                <CircleHelp className="mr-2 h-4 w-4" />
                <span>Centro de ayuda</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Tema */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-default hover:bg-transparent focus:bg-transparent"
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
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* NavigationSheet - Sheet con navegación completa */}
      <NavigationSheet
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
        user={user}
        navigationItems={navigationItems}
        navigationManagersItems={navigationManagersItems}
        apps={apps}
        loading={loading}
      />
    </header>
  );
}
