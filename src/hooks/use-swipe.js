"use client";

import * as React from 'react';

/**
 * Hook para detectar gestos de swipe
 * 
 * @param {object} options
 * @param {Function} options.onSwipeUp - Callback cuando se detecta swipe hacia arriba
 * @param {Function} options.onSwipeDown - Callback cuando se detecta swipe hacia abajo
 * @param {number} options.threshold - Distancia mínima en píxeles para considerar un swipe (default: 50)
 * @param {number} options.maxVerticalDistance - Distancia máxima vertical permitida (default: 100)
 * @returns {object} Handlers para onTouchStart, onTouchMove, onTouchEnd
 */
export function useSwipe({ 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  maxVerticalDistance = 100 
}) {
  // Usar refs para almacenar valores que no necesitan causar re-renders
  const touchStartY = React.useRef(0);
  const touchEndY = React.useRef(0);
  
  // Guardar callbacks en refs para acceso estable
  const onSwipeUpRef = React.useRef(onSwipeUp);
  const onSwipeDownRef = React.useRef(onSwipeDown);
  
  // Actualizar refs cuando cambian los callbacks
  React.useEffect(() => {
    onSwipeUpRef.current = onSwipeUp;
    onSwipeDownRef.current = onSwipeDown;
  }, [onSwipeUp, onSwipeDown]);

  const onTouchStart = React.useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = 0; // Reset
  }, []);

  const onTouchMove = React.useCallback((e) => {
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = React.useCallback(() => {
    const startY = touchStartY.current;
    const endY = touchEndY.current;
    
    if (!startY || !endY) return;

    const distance = startY - endY; // Positivo = swipe hacia arriba
    const isVerticalSwipe = Math.abs(distance) > threshold;

    if (isVerticalSwipe) {
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
    touchEndY.current = 0;
  }, [threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

