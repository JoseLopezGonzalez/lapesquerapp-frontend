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
import { useDragToClose } from "@/hooks/use-drag-to-close";

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
 * Diseño minimalista con solo iconos. Soporta swipe up y drag-to-open para abrir NavigationSheet.
 * 
 * @param {object} props
 * @param {Array} props.items - Items de navegación principales (4-5 máximo)
 * @param {Function} props.onSwipeUp - Callback cuando se detecta swipe hacia arriba (opcional)
 * @param {boolean} props.sheetOpen - Si el NavigationSheet está abierto
 * @param {Function} props.onSheetOpenChange - Callback cuando cambia el estado del sheet
 * @param {Function} props.onDragStateChange - Callback cuando cambia el estado del drag (translateY, isDragging)
 */
export function BottomNav({ items, onSwipeUp, sheetOpen = false, onSheetOpenChange, onDragStateChange }) {
  // IMPORTANTE: Los hooks SIEMPRE deben ejecutarse en el mismo orden
  // Por eso los ponemos ANTES de cualquier early return condicional
  const pathname = usePathname();
  const swipeZoneRef = React.useRef(null); // Ref para la barra indicadora
  
  // Hook para drag-to-open desde la barra indicadora cuando el sheet está cerrado
  const { translateY: dragTranslateY, isDragging: isDraggingOpen, handlers: dragHandlers } = useDragToClose({
    isOpen: sheetOpen,
    onOpen: () => onSheetOpenChange?.(true),
    threshold: 0.3,
    velocityThreshold: 0.5,
    dragHandleRef: swipeZoneRef,
  });
  
  // Notificar el estado del drag al padre
  React.useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange({
        translateY: !sheetOpen && isDraggingOpen ? dragTranslateY : 0,
        isDragging: !sheetOpen && isDraggingOpen,
      });
    }
  }, [dragTranslateY, isDraggingOpen, sheetOpen, onDragStateChange]);
  
  // Hook para detectar swipe up - solo desde la barra indicadora
  const swipeHandlers = useSwipe({
    onSwipeUp: onSwipeUp || (() => {}),
    threshold: 50, // Distancia mínima de 50px para considerar swipe
    velocityThreshold: 0.3, // px/ms - velocidad mínima para distinguir de scroll
    maxHorizontalDistance: 30, // Máximo 30px de movimiento horizontal
    activationZoneRef: swipeZoneRef, // Solo activar desde la barra indicadora
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

  // Asegurar que swipeHandlers siempre tenga valores válidos
  const safeSwipeHandlers = swipeHandlers || {
    onTouchStart: () => {},
    onTouchMove: () => {},
    onTouchEnd: () => {},
  };
  
  // Combinar handlers: drag-to-open cuando está cerrado, swipe cuando está abierto
  const combinedHandlers = !sheetOpen && dragHandlers ? {
    ...safeSwipeHandlers,
    ...dragHandlers, // Drag-to-open tiene prioridad cuando está cerrado
  } : safeSwipeHandlers;

  return (
    <nav
      {...combinedHandlers} // Agregar handlers de swipe y drag
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
        "grid grid-cols-5 items-end", // Grid de 5 columnas para distribución uniforme
        "px-6 pt-3 pb-4", // Padding superior normal, padding inferior aumentado
        "max-w-md mx-auto", // Centrar y limitar ancho
        "gap-0" // Sin gap entre columnas
      )}>
        {/* Item 1 */}
        <div className="flex items-center justify-center">
          {displayItems.slice(0, 1).map((item, index) => {
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
        
        {/* Item 2 */}
        <div className="flex items-center justify-center">
          {displayItems.slice(1, 2).map((item, index) => {
            const actualIndex = index + 1;
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
        
        {/* Botón central de acción - Columna 3 */}
        <div className="flex items-center justify-center">
          <CenterActionButton />
        </div>
        
        {/* Item 3 */}
        <div className="flex items-center justify-center">
          {displayItems.slice(2, 3).map((item, index) => {
            const actualIndex = index + 2;
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
        
        {/* Item 4 */}
        <div className="flex items-center justify-center">
          {displayItems.slice(3).map((item, index) => {
            const actualIndex = index + 3;
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
      
      {/* Barra indicadora para swipe - Centrada perfectamente */}
      <div 
        ref={swipeZoneRef}
        className="flex items-center justify-center pt-1 pb-3 touch-none"
        style={{ touchAction: 'pan-y' }} // Permitir scroll vertical pero capturar swipe
      >
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
      </div>
    </nav>
  );
}
