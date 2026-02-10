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
import { MOBILE_SAFE_AREAS } from "@/lib/design-tokens-mobile";
import { feedbackPop } from "@/lib/motion-presets";
import { isActiveRoute } from "@/utils/navigationUtils";
import { ChatNavItem } from "./ChatNavItem";
import { CenterActionButton } from "./CenterActionButton";

/**
 * BottomNavItem - Item individual de la navegación inferior
 * 
 * Con icono y texto debajo
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
      className="flex flex-col items-center justify-center flex-shrink-0"
    >
      {item?.onClick ? (
        // Item especial con onClick (ej. Chat IA)
        <button
          onClick={item.onClick}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1",
            "min-h-[44px] min-w-[44px]",
            "px-2 py-1.5 rounded-lg",
            "transition-all duration-200",
            "touch-none",
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent"
          )}
          aria-label={item?.name || 'Navegación'}
        >
          {Icon && (
            <Icon 
              className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : ""
              )} 
            />
          )}
          <span className={cn(
            "text-[10px] font-medium leading-tight",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {item?.name || ''}
          </span>
        </button>
      ) : (
        // Item normal con Link
        <Link
          href={item?.href || '#'}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1",
            "min-h-[44px] min-w-[44px]",
            "px-2 py-1.5 rounded-lg",
            "transition-all duration-200",
            "touch-none",
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent"
          )}
          aria-label={item?.name || 'Navegación'}
        >
          {Icon && (
            <Icon 
              className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : ""
              )} 
            />
          )}
          <span className={cn(
            "text-[10px] font-medium leading-tight",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {item?.name || ''}
          </span>
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
 * @param {boolean} props.sheetOpen - Si el NavigationSheet está abierto
 * @param {Function} props.onSheetOpenChange - Callback cuando cambia el estado del sheet
 */
export function BottomNav({ items, sheetOpen = false, onSheetOpenChange }) {
  const pathname = usePathname();

  // Limitar a 5 items máximo - calcular siempre, incluso si está vacío
  const displayItems = React.useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }
    return items.slice(0, 5);
  }, [items]);

  // 4 items + botón central = 5 columnas
  const gridCols = "grid-cols-5";
  const columnCount = displayItems.length + 1;

  // Early return DESPUÉS de los hooks
  if (!displayItems || displayItems.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-sm",
        "border-t",
        "shadow-lg",
        MOBILE_SAFE_AREAS.BOTTOM,
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className={cn(
        "container mx-auto",
        "grid items-end",
        gridCols,
        "px-6 pt-3 pb-4",
        "max-w-md mx-auto",
        "gap-0"
      )}>
        {/* Columnas: [item0, item1, center, item2, item3, item4?] */}
        {Array.from({ length: columnCount }, (_, i) => i).map((colIndex) => {
          const itemIndex = colIndex < 2 ? colIndex : colIndex - 1; // 2 es centro
          const item = displayItems[itemIndex];
          if (colIndex === 2) {
            return (
              <div key="center" className="flex items-center justify-center">
                <CenterActionButton onOpenSheet={onSheetOpenChange} />
              </div>
            );
          }
          if (!item) return <div key={`empty-${colIndex}`} />;
          if (item.name === 'Chat IA' && !item.href) {
            return (
              <div key="chat-ai" className="flex items-center justify-center">
                <ChatNavItem index={colIndex} />
              </div>
            );
          }
          const itemHref = item.href || item.childrens?.[0]?.href || '#';
          const isActive = itemHref !== '#' ? isActiveRoute(itemHref, pathname) : false;
          return (
            <div key={itemHref || item.name || `item-${colIndex}`} className="flex items-center justify-center">
              <BottomNavItem
                item={{ ...item, href: itemHref }}
                isActive={isActive}
                index={colIndex}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}
