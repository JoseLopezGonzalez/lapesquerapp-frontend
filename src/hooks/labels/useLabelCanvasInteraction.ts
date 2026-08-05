'use client';

import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';
import type { LabelElement } from '@/types/labelEditor';

const pxToMm = (px: number): number => px / 3.78;

const DRAG_THRESHOLD_PX = 3;

interface UseLabelCanvasInteractionParams {
  selectedElement: string | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<string | null>>;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  elements: LabelElement[];
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
}

export interface UseLabelCanvasInteractionResult {
  canvasRef: RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent, elementId: string) => void;
  handleResizeMouseDown: (e: React.MouseEvent, elementId: string, corner: string) => void;
}

export function useLabelCanvasInteraction({
  selectedElement,
  setSelectedElement,
  zoom,
  canvasWidth,
  canvasHeight,
  elements,
  updateElement,
}: UseLabelCanvasInteractionParams): UseLabelCanvasInteractionResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    elX: number;
    elY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const wasSelectedOnMouseDownRef = useRef(false);
  const clickedElementIdRef = useRef<string | null>(null);
  const hasExceededDragThresholdRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    clickedElementIdRef.current = elementId;
    wasSelectedOnMouseDownRef.current = selectedElement === elementId;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasExceededDragThresholdRef.current = false;

    if (!wasSelectedOnMouseDownRef.current) {
      setSelectedElement(elementId);
    }

    setIsDragging(true);
    const element = elements.find((el) => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: pxToMm(e.clientX - rect.left) / zoom - element.x,
        y: pxToMm(e.clientY - rect.top) / zoom - element.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, corner: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeCorner(corner);
    const element = elements.find((el) => el.id === elementId);
    if (element && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setResizeStart({
        x: pxToMm(e.clientX - rect.left) / zoom,
        y: pxToMm(e.clientY - rect.top) / zoom,
        width: element.width,
        height: element.height,
        elX: element.x,
        elY: element.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if ((!isDragging && !isResizing) || !canvasRef.current) return;

      if (isDragging && mouseDownPosRef.current && !hasExceededDragThresholdRef.current) {
        const movedX = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const movedY = Math.abs(e.clientY - mouseDownPosRef.current.y);
        if (movedX > DRAG_THRESHOLD_PX || movedY > DRAG_THRESHOLD_PX) {
          hasExceededDragThresholdRef.current = true;
          if (
            wasSelectedOnMouseDownRef.current &&
            !selectedElement &&
            clickedElementIdRef.current
          ) {
            setSelectedElement(clickedElementIdRef.current);
          }
        }
      }

      if (!selectedElement) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const curX = pxToMm(e.clientX - rect.left) / zoom;
      const curY = pxToMm(e.clientY - rect.top) / zoom;

      if (isDragging && hasExceededDragThresholdRef.current) {
        const newX = curX - dragOffset.x;
        const newY = curY - dragOffset.y;
        const element = elements.find((el) => el.id === selectedElement);
        const maxX = canvasWidth - (element?.width || 0);
        const maxY = canvasHeight - (element?.height || 0);
        updateElement(selectedElement, {
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY)),
        });
      }

      if (isResizing && resizeStart) {
        const dx = curX - resizeStart.x;
        const dy = curY - resizeStart.y;
        let { width, height, elX, elY } = resizeStart;

        switch (resizeCorner) {
          case 'se':
            width += dx;
            height += dy;
            break;
          case 'sw':
            width -= dx;
            height += dy;
            elX += dx;
            break;
          case 'ne':
            width += dx;
            height -= dy;
            elY += dy;
            break;
          case 'nw':
            width -= dx;
            height -= dy;
            elX += dx;
            elY += dy;
            break;
        }

        width = Math.max(10 / 3.78, width);
        height = Math.max(10 / 3.78, height);
        const maxX = canvasWidth - width;
        const maxY = canvasHeight - height;

        updateElement(selectedElement, {
          x: Math.max(0, Math.min(maxX, elX)),
          y: Math.max(0, Math.min(maxY, elY)),
          width,
          height,
        });
      }
    },
    [
      isDragging,
      isResizing,
      selectedElement,
      dragOffset,
      resizeStart,
      resizeCorner,
      zoom,
      canvasWidth,
      canvasHeight,
      elements,
      setSelectedElement,
      updateElement,
    ]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (
        wasSelectedOnMouseDownRef.current &&
        mouseDownPosRef.current &&
        e &&
        clickedElementIdRef.current
      ) {
        const movedX = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const movedY = Math.abs(e.clientY - mouseDownPosRef.current.y);
        if (movedX <= 3 && movedY <= 3) {
          setSelectedElement(null);
        }
      }
      setIsDragging(false);
      setIsResizing(false);
      mouseDownPosRef.current = null;
      wasSelectedOnMouseDownRef.current = false;
      clickedElementIdRef.current = null;
      hasExceededDragThresholdRef.current = false;
    },
    [setSelectedElement]
  );

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return { canvasRef, handleMouseDown, handleResizeMouseDown };
}
