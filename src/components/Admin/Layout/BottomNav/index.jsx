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
import { CenterActionButton } from "./CenterActionButton";
import { useSwipe } from "@/hooks/use-swipe";

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
      className="flex-1 flex flex-col items-center justify-center"
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
 * Diseño minimalista con solo iconos. Soporta swipe up para abrir NavigationSheet.
 * 
 * @param {object} props
 * @param {Array} props.items - Items de navegación principales (4-5 máximo)
 * @param {Function} props.onSwipeUp - Callback cuando se detecta swipe hacia arriba (opcional)
 */
export function BottomNav({ items, onSwipeUp }) {
  // IMPORTANTE: Los hooks SIEMPRE deben ejecutarse en el mismo orden
  // Por eso los ponemos ANTES de cualquier early return condicional
  const pathname = usePathname();
  
  // Hook para detectar swipe up
  const swipeHandlers = useSwipe({
    onSwipeUp: onSwipeUp || (() => {}),
    threshold: 50, // Distancia mínima de 50px para considerar swipe
  });

  // Limitar a 5 items máximo - calcular siempre, incluso si está vacío
  const displayItems = React.useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }
    return items.slice(0, 5);
  }, [items]);

  // Early return DESPUÉS de los hooks
  if (!displayItems || displayItems.length === 0) {
    return null;
  }

  return (
    <nav
      {...swipeHandlers} // Agregar handlers de swipe
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
        "flex items-end", // items-end para alinear el botón central elevado
        "px-2 py-3", // Padding ajustado
        "max-w-md mx-auto", // Centrar y limitar ancho
        "gap-0" // Sin gap adicional, lo controlamos internamente
      )}>
        {/* Grupo izquierdo: Primeros 2 items */}
        <div className="flex-1 flex items-center justify-evenly">
          {displayItems.slice(0, 2).map((item, index) => {
            // Si es Chat IA, usar componente especial
            if (item.name === 'Chat IA' && !item.href) {
              return <ChatNavItem key="chat-ai" index={index} />;
            }
            
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
        
        {/* Botón central de acción */}
        <div className="flex-shrink-0 mx-2">
          <CenterActionButton />
        </div>
        
        {/* Grupo derecho: Últimos 2 items */}
        <div className="flex-1 flex items-center justify-evenly">
          {displayItems.slice(2).map((item, index) => {
            const actualIndex = index + 2; // Ajustar índice para continuidad
            
            // Si es Chat IA, usar componente especial
            if (item.name === 'Chat IA' && !item.href) {
              return <ChatNavItem key="chat-ai" index={actualIndex} />;
            }
            
            const itemHref = item.href || item.childrens?.[0]?.href || '#';
            const isActive = itemHref !== '#' ? isActiveRoute(itemHref, pathname) : false;
            
            return (
              <BottomNavItem
                key={itemHref || item.name || `item-${actualIndex}`}
                item={{ ...item, href: itemHref }}
                isActive={isActive}
                index={actualIndex}
              />
            );
          })}
        </div>
      </div>
      
      {/* Barra indicadora para swipe - Debajo de los iconos */}
      <div className="flex items-center justify-center pt-1 pb-2">
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
      </div>
    </nav>
  );
}


