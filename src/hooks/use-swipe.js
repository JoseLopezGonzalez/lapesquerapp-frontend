"use client";

import * as React from 'react';

/**
 * Hook para detectar gestos de swipe mejorado
 * 
 * Mejoras:
 * - Distingue entre scroll y swipe intencional
 * - Calcula velocidad del gesto
 * - Solo activa si el swipe es claramente vertical
 * - Opción de zona de activación específica
 * 
 * @param {object} options
 * @param {Function} options.onSwipeUp - Callback cuando se detecta swipe hacia arriba
 * @param {Function} options.onSwipeDown - Callback cuando se detecta swipe hacia abajo
 * @param {number} options.threshold - Distancia mínima en píxeles para considerar un swipe (default: 50)
 * @param {number} options.velocityThreshold - Velocidad mínima (px/ms) para considerar swipe intencional (default: 0.3)
 * @param {number} options.maxHorizontalDistance - Distancia máxima horizontal permitida (default: 30px)
 * @param {React.RefObject} options.activationZoneRef - Ref del elemento que activa el swipe (opcional)
 * @returns {object} Handlers para onTouchStart, onTouchMove, onTouchEnd
 */
export function useSwipe({ 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3, // px/ms
  maxHorizontalDistance = 30, // px
  activationZoneRef,
}) {
  // Usar refs para almacenar valores que no necesitan causar re-renders
  const touchStartY = React.useRef(0);
  const touchStartX = React.useRef(0);
  const touchEndY = React.useRef(0);
  const touchEndX = React.useRef(0);
  const touchStartTime = React.useRef(0);
  const touchEndTime = React.useRef(0);
  const lastTouchY = React.useRef(0);
  const lastTouchTime = React.useRef(0);
  
  // Guardar callbacks en refs para acceso estable
  const onSwipeUpRef = React.useRef(onSwipeUp);
  const onSwipeDownRef = React.useRef(onSwipeDown);
  
  // Actualizar refs cuando cambian los callbacks
  React.useEffect(() => {
    onSwipeUpRef.current = onSwipeUp;
    onSwipeDownRef.current = onSwipeDown;
  }, [onSwipeUp, onSwipeDown]);

  // Verificar si el touch comenzó en la zona de activación
  const isTouchInActivationZone = React.useCallback((touch) => {
    if (!activationZoneRef?.current) return true; // Si no hay ref, permitir siempre
    
    const zoneRect = activationZoneRef.current.getBoundingClientRect();
    const touchY = touch.clientY;
    const touchX = touch.clientX;
    
    return (
      touchY >= zoneRect.top &&
      touchY <= zoneRect.bottom &&
      touchX >= zoneRect.left &&
      touchX <= zoneRect.right
    );
  }, [activationZoneRef]);

  const onTouchStart = React.useCallback((e) => {
    const touch = e.touches[0];
    
    // Verificar si el touch comenzó en la zona de activación
    if (!isTouchInActivationZone(touch)) {
      return;
    }
    
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchEndY.current = 0;
    touchEndX.current = 0;
    touchStartTime.current = Date.now();
    lastTouchY.current = touch.clientY;
    lastTouchTime.current = Date.now();
  }, [isTouchInActivationZone]);

  const onTouchMove = React.useCallback((e) => {
    const touch = e.touches[0];
    touchEndY.current = touch.clientY;
    touchEndX.current = touch.clientX;
    lastTouchY.current = touch.clientY;
    lastTouchTime.current = Date.now();
  }, []);

  const onTouchEnd = React.useCallback(() => {
    const startY = touchStartY.current;
    const endY = touchEndY.current;
    const startX = touchStartX.current;
    const endX = touchEndX.current;
    
    if (!startY || !endY) return;

    const verticalDistance = Math.abs(startY - endY);
    const horizontalDistance = Math.abs(startX - endX);
    const distance = startY - endY; // Positivo = swipe hacia arriba
    
    // Calcular velocidad (px/ms)
    const timeDelta = lastTouchTime.current - touchStartTime.current;
    const velocity = timeDelta > 0 ? verticalDistance / timeDelta : 0;
    
    // Verificar condiciones para considerar un swipe intencional:
    // 1. Distancia vertical suficiente
    // 2. Movimiento principalmente vertical (no horizontal)
    // 3. Velocidad suficiente (para distinguir de scroll lento)
    const isVerticalSwipe = verticalDistance > threshold;
    const isMainlyVertical = horizontalDistance < maxHorizontalDistance;
    const isFastEnough = velocity > velocityThreshold;
    
    // Solo activar si es un swipe claramente intencional
    if (isVerticalSwipe && isMainlyVertical && isFastEnough) {
      if (distance > 0) {
        // Swipe hacia arriba
        onSwipeUpRef.current?.();
      } else {
        // Swipe hacia abajo
        onSwipeDownRef.current?.();
      }
    }
    
    // Reset
    touchStartY.current = 0;
    touchStartX.current = 0;
    touchEndY.current = 0;
    touchEndX.current = 0;
    touchStartTime.current = 0;
    touchEndTime.current = 0;
    lastTouchY.current = 0;
    lastTouchTime.current = 0;
  }, [threshold, maxHorizontalDistance, velocityThreshold]);

  // Asegurar que siempre devolvemos un objeto válido
  return {
    onTouchStart: onTouchStart || (() => {}),
    onTouchMove: onTouchMove || (() => {}),
    onTouchEnd: onTouchEnd || (() => {}),
  };
}

