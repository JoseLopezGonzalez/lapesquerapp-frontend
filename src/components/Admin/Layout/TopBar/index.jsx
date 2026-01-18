"use client";

/**
 * TopBar - Barra superior para mobile
 * 
 * Barra superior fija para dispositivos móviles con:
 * - Logo (izquierda)
 * - Botón menú (izquierda) - Abre Sheet con navegación completa
 * - Usuario/Dropdown (derecha)
 * 
 * En esta fase inicial, el botón menú es un placeholder.
 * El Sheet se añadirá en la siguiente fase.
 * 
 * Referencia: docs/mobile-adaptation/implementaciones/01-LAYOUT-NAVEGACION.md
 */

import * as React from "react";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOBILE_HEIGHTS, MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import { NAVBAR_LOGO } from "@/configs/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

/**
 * TopBar - Componente principal de barra superior
 * 
 * @param {object} props
 * @param {Function} props.onMenuClick - Callback cuando se clickea el botón menú
 * @param {object} props.user - Objeto usuario con name, email, logout
 */
export function TopBar({ onMenuClick, user }) {
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
        "fixed top-0 left-0 right-0 z-50",
        "bg-background border-b",
        "shadow-sm",
        MOBILE_SAFE_AREAS.TOP,
        "animate-in slide-in-from-top duration-300"
      )}
    >
      <div
        className={cn(
          "container mx-auto",
          "flex items-center justify-between",
          "px-4 py-3",
          MOBILE_HEIGHTS.INPUT // h-12 para altura consistente
        )}
      >
        {/* Left: Logo y Menú */}
        <div className="flex items-center gap-3">
          {/* Botón Menú (placeholder - Sheet se añadirá después) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <img
            src={NAVBAR_LOGO}
            alt="PesquerApp"
            className="h-10 w-auto object-contain"
          />
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
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            side="bottom"
            sideOffset={8}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={user?.logout} className="cursor-pointer">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

