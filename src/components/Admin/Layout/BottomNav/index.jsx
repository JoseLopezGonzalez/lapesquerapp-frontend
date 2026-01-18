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
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOBILE_HEIGHTS, MOBILE_SAFE_AREAS, MOBILE_ICON_SIZES } from "@/lib/design-tokens-mobile";
import { feedbackPop } from "@/lib/motion-presets";
import { isActiveRoute } from "@/utils/navigationUtils";
import { ChatNavItem } from "./ChatNavItem";

/**
 * BottomNavItem - Item individual de la navegación inferior
 * 
 * Usa feedbackPop para animación al tocar (feedback visual)
 */
function BottomNavItem({ item, isActive, index }) {
  const Icon = item?.icon;
  const prefersReducedMotion = useReducedMotion();

  // Transición con delay para stagger (entrada escalonada)
  const itemTransition = React.useMemo(() => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }
    return {
      ...feedbackPop.transition,
      delay: index * 0.03,
    };
  }, [index, prefersReducedMotion]);

  return (
    <motion.div
      initial={feedbackPop.initial}
      animate={feedbackPop.animate}
      exit={feedbackPop.exit}
      transition={itemTransition}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      className="flex-1"
    >
      {item?.onClick ? (
        // Item especial con onClick (ej. Chat IA)
        <button
          onClick={item.onClick}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 w-full",
            "min-h-[44px] min-w-[44px]",
            "px-2 py-1.5 pb-2 rounded-lg", // px-2 py-1.5 pb-2 para espacio más compacto
            "transition-colors duration-200",
            "touch-none", // Mejorar rendimiento en mobile
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent"
          )}
          aria-label={item?.name || 'Navegación'}
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
            "text-[10px] font-medium leading-tight",
            "truncate max-w-full px-1", // Truncar texto largo y centrar
            isActive ? "text-primary" : ""
          )}>
            {item?.name || ''}
          </span>
          {isActive && (
            <motion.span 
              className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2",
                "w-1 h-1 rounded-full bg-primary"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            />
          )}
        </button>
      ) : (
        // Item normal con Link
        <Link
          href={item?.href || '#'}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 w-full",
            "min-h-[44px] min-w-[44px]",
            "px-2 py-1.5 pb-2 rounded-lg", // px-2 py-1.5 pb-2 para espacio más compacto
            "transition-colors duration-200",
            "touch-none", // Mejorar rendimiento en mobile
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent"
          )}
          aria-label={item?.name || 'Navegación'}
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
            "text-[10px] font-medium leading-tight",
            "truncate max-w-full px-1", // Truncar texto largo y centrar
            isActive ? "text-primary" : ""
          )}>
            {item?.name || ''}
          </span>
          {isActive && (
            <motion.span 
              className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2",
                "w-1 h-1 rounded-full bg-primary"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            />
          )}
        </Link>
      )}
    </motion.div>
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
        "px-2 py-2 pb-3", // py-2 pb-3 para espacio reducido pero suficiente para el punto
        MOBILE_HEIGHTS.BOTTOM_NAV
      )}>
        {displayItems.map((item, index) => {
          // Si es Chat IA, usar componente especial
          if (item.name === 'Chat IA' && !item.href) {
            return <ChatNavItem key="chat-ai" index={index} />;
          }
          
          // Asegurar que el item tenga href (si no tiene, usar el primer children o '#')
          const itemHref = item.href || item.childrens?.[0]?.href || '#';
          const isActive = itemHref !== '#' ? isActiveRoute(itemHref, pathname) : false;
          
          return (
            <BottomNavItem
              key={itemHref || item.name || `item-${index}`}
              item={{ ...item, href: itemHref }}
              isActive={isActive}
              index={index}
            />
          );
        })}
      </div>
    </nav>
  );
}

