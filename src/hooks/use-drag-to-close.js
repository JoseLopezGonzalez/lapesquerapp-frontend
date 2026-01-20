"use client";

import * as React from 'react';

/**
 * Hook para drag-to-open/close fluido que sigue el dedo exactamente
 * 
 * Comportamiento:
 * - Sigue el dedo 1:1 mientras se arrastra (sin animación)
 * - Si se desliza rápido → anima y cierra/abre completamente
 * - Si se desliza lento → sigue el dedo hasta soltar, luego decide
 * 
 * @param {object} options
 * @param {boolean} options.isOpen - Si el sheet está abierto
 * @param {Function} options.onClose - Callback para cerrar
 * @param {Function} options.onOpen - Callback para abrir (opcional)
 * @param {number} options.threshold - Porcentaje de altura para cerrar/abrir (0-1, default: 0.3)
 * @param {number} options.velocityThreshold - Velocidad mínima (px/ms) para cerrar/abrir automáticamente (default: 0.5)
 * @param {React.RefObject} options.dragHandleRef - Ref del elemento que activa el drag (barra indicadora)
 * @returns {object} { translateY, isDragging, handlers }
 */
export function useDragToClose({
  isOpen,
  onClose,
  onOpen,
  threshold = 0.3, // 30% de la altura para cerrar/abrir
  velocityThreshold = 0.5, // px/ms
  dragHandleRef,
}) {
  const [translateY, setTranslateY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Refs para valores que no necesitan re-render
  const touchStartY = React.useRef(0);
  const touchStartTime = React.useRef(0);
  const lastTouchY = React.useRef(0);
  const lastTouchTime = React.useRef(0);
  const sheetHeight = React.useRef(0);
  const initialTranslateY = React.useRef(0);
  const isDraggingFromHandle = React.useRef(false);
  const animationFrameId = React.useRef(null);

  // Guardar callbacks en refs
  const onCloseRef = React.useRef(onClose);
  const onOpenRef = React.useRef(onOpen);
  
  React.useEffect(() => {
    onCloseRef.current = onClose;
    onOpenRef.current = onOpen;
  }, [onClose, onOpen]);

  // Reset cuando se abre/cierra
  React.useEffect(() => {
    if (!isOpen && !isDragging) {
      setTranslateY(0);
    }
    if (isOpen && !isDragging) {
      setTranslateY(0);
    }
  }, [isOpen, isDragging]);

  // Calcular altura del sheet
  const getSheetHeight = React.useCallback(() => {
    if (typeof window === 'undefined') return window.innerHeight * 0.85;
    return window.innerHeight * 0.85; // 85vh
  }, []);

  // Verificar si el touch comenzó en el handle
  const isTouchOnHandle = React.useCallback((touch) => {
    if (!dragHandleRef?.current) return true; // Si no hay ref, permitir siempre
    
    const handleRect = dragHandleRef.current.getBoundingClientRect();
    const touchY = touch.clientY;
    const touchX = touch.clientX;
    
    return (
      touchY >= handleRect.top &&
      touchY <= handleRect.bottom &&
      touchX >= handleRect.left &&
      touchX <= handleRect.right
    );
  }, [dragHandleRef]);

  const handleTouchStart = React.useCallback((e) => {
    // Activar si el sheet está abierto (drag-to-close) o cerrado con onOpen (drag-to-open)
    if (!isOpen && !onOpen) return;
    
    const touch = e.touches[0];
    
    // Verificar si el touch comenzó en el handle
    if (!isTouchOnHandle(touch)) {
      return; // No comenzar drag si no es desde el handle
    }
    
    // Prevenir scroll durante el drag
    e.preventDefault();
    
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    lastTouchY.current = touch.clientY;
    lastTouchTime.current = Date.now();
    sheetHeight.current = getSheetHeight();
    
    // Inicializar translateY según el estado
    if (isOpen) {
      // Sheet abierto: empezar desde 0 (posición normal)
      initialTranslateY.current = 0;
      setTranslateY(0);
    } else {
      // Sheet cerrado: empezar desde sheetHeight (completamente fuera de la pantalla)
      initialTranslateY.current = sheetHeight.current;
      setTranslateY(sheetHeight.current);
    }
    
    isDraggingFromHandle.current = true;
    setIsDragging(true);
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  }, [isOpen, onOpen, isTouchOnHandle, getSheetHeight]);

  // Función helper para animar a una posición
  const animateToPosition = React.useCallback((startY, targetY) => {
    const startTime = Date.now();
    const duration = 200; // 200ms para animación suave
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newY = startY + (targetY - startY) * easeOut;
      
      setTranslateY(newY);
      
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setTranslateY(targetY);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
  }, []);

  const handleTouchMove = React.useCallback((e) => {
    if (!isDraggingFromHandle.current) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const currentTime = Date.now();
    
    // Calcular diferencia desde el inicio (positivo = hacia abajo, negativo = hacia arriba)
    const deltaY = currentY - touchStartY.current;
    
    if (isOpen) {
      // Sheet abierto: arrastrar hacia abajo (deltaY positivo) aumenta translateY
      // translateY va de 0 (abierto) a sheetHeight (cerrado)
      const newTranslateY = Math.max(0, Math.min(sheetHeight.current, deltaY));
      setTranslateY(newTranslateY);
    } else if (onOpen) {
      // Sheet cerrado: arrastrar hacia arriba (deltaY negativo) disminuye translateY
      // translateY va de sheetHeight (cerrado, fuera de pantalla) a 0 (abierto)
      // deltaY negativo = movimiento hacia arriba = el dedo se mueve hacia arriba
      // Si initialTranslateY = sheetHeight y deltaY es negativo, entonces:
      // newTranslateY = sheetHeight + deltaY (que disminuye hacia 0)
      const newTranslateY = Math.max(0, Math.min(sheetHeight.current, initialTranslateY.current + deltaY));
      setTranslateY(newTranslateY);
    }
    
    // Actualizar para cálculo de velocidad
    lastTouchY.current = currentY;
    lastTouchTime.current = currentTime;
  }, [isOpen, onOpen, isDraggingFromHandle, sheetHeight, initialTranslateY]);

  const handleTouchEnd = React.useCallback(() => {
    if (!isDraggingFromHandle.current) return;
    
    setIsDragging(false);
    isDraggingFromHandle.current = false;
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    
    // Calcular velocidad (px/ms)
    const timeDelta = lastTouchTime.current - touchStartTime.current;
    const distanceDelta = lastTouchY.current - touchStartY.current;
    const velocity = timeDelta > 0 ? Math.abs(distanceDelta) / timeDelta : 0;
    
    const currentTranslateY = translateY;
    const thresholdPixels = sheetHeight.current * threshold;
    
    if (isOpen) {
      // Sheet abierto: decidir si cerrar
      if (velocity > velocityThreshold && currentTranslateY > 0) {
        // Deslizó rápido hacia abajo → cerrar con animación
        onCloseRef.current?.();
        setTranslateY(0);
      } else if (currentTranslateY > thresholdPixels) {
        // Deslizó más del threshold → cerrar con animación
        onCloseRef.current?.();
        setTranslateY(0);
      } else {
        // Volver a posición inicial con animación suave
        animateToPosition(currentTranslateY, 0);
      }
    } else if (onOpen) {
      // Sheet cerrado: decidir si abrir
      // currentTranslateY va de sheetHeight (cerrado, fuera) a 0 (abierto, visible)
      const distanceFromClosed = sheetHeight.current - currentTranslateY; // Cuánto se ha movido desde cerrado
      
      // Calcular velocidad hacia arriba (deltaY negativo = movimiento hacia arriba)
      const velocityUp = distanceDelta < 0 ? Math.abs(distanceDelta) / timeDelta : 0;
      
      if (velocityUp > velocityThreshold && currentTranslateY < sheetHeight.current) {
        // Deslizó rápido hacia arriba → abrir con animación
        onOpenRef.current?.();
        setTranslateY(0);
      } else if (distanceFromClosed > thresholdPixels) {
        // Deslizó más del threshold hacia arriba → abrir con animación
        onOpenRef.current?.();
        setTranslateY(0);
      } else {
        // Volver a posición inicial (cerrado) con animación suave
        animateToPosition(currentTranslateY, sheetHeight.current);
      }
    }
  }, [isOpen, onOpen, translateY, threshold, velocityThreshold, sheetHeight, animateToPosition]);

  // Limpiar al desmontar
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return {
    translateY,
    isDragging,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

