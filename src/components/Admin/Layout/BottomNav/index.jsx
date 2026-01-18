"use client";

/**
 * BottomNav - Navegación inferior para mobile
 * 
 * Componente de navegación fija inferior para dispositivos móviles.
 * Muestra 4-5 items principales con iconos y labels cortos.
 * 
 * Reglas:
 * - Solo navegación primaria (rutas principales)
 * - NUNCA acciones destructivas, configuraciones o logout
 * - Touch targets mínimo 44x44px
 * - Safe areas iOS respetadas
 * 
 * Referencia: docs/mobile-adaptation/implementaciones/01-LAYOUT-NAVEGACION.md
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_HEIGHTS, MOBILE_SAFE_AREAS, MOBILE_ICON_SIZES } from "@/lib/design-tokens-mobile";
import { isActiveRoute } from "@/utils/navigationUtils";

/**
 * BottomNavItem - Item individual de la navegación inferior
 */
function BottomNavItem({ item, isActive }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "min-h-[44px] min-w-[44px]",
        "px-3 py-2 rounded-lg",
        "transition-colors duration-200",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      aria-label={item.name}
    >
      {Icon && (
        <Icon 
          className={cn(
            MOBILE_ICON_SIZES.BOTTOM_NAV,
            isActive ? "text-primary" : ""
          )} 
        />
      )}
      <span className={cn(
        "text-xs font-medium leading-tight",
        isActive ? "text-primary" : ""
      )}>
        {item.name}
      </span>
      {isActive && (
        <span 
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2",
            "w-1 h-1 rounded-full bg-primary"
          )} 
        />
      )}
    </Link>
  );
}

/**
 * BottomNav - Componente principal de navegación inferior
 * 
 * @param {object} props
 * @param {Array} props.items - Items de navegación principales (4-5 máximo)
 */
export function BottomNav({ items }) {
  const pathname = usePathname();

  if (!items || items.length === 0) {
    return null;
  }

  // Limitar a 5 items máximo
  const displayItems = items.slice(0, 5);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t",
        "shadow-lg",
        MOBILE_SAFE_AREAS.BOTTOM,
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className={cn(
        "container mx-auto",
        "flex items-center justify-around",
        "px-2 py-2",
        MOBILE_HEIGHTS.BOTTOM_NAV
      )}>
        {displayItems.map((item) => {
          const isActive = isActiveRoute(item.href, pathname);
          
          return (
            <BottomNavItem
              key={item.href || item.name}
              item={item}
              isActive={isActive}
            />
          );
        })}
      </div>
    </nav>
  );
}

