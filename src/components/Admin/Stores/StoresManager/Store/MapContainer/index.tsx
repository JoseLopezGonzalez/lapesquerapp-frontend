'use client';

import React, { useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Expand } from 'lucide-react';

interface MapContainerProps {
  children: React.ReactNode;
  isMobile?: boolean;
}

const MapContainer = ({ children, isMobile = false }: MapContainerProps) => {
  const resetTransformRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (resetTransformRef.current) {
      setTimeout(() => {
        resetTransformRef.current?.();
      }, 100);
    }
  }, []);

  const initialScale = isMobile ? 0.7 : 1.2;
  const minScale = isMobile ? 0.15 : 0.3;
  const maxScale = isMobile ? 6 : 3;
  const contentStyle: React.CSSProperties = isMobile
    ? { width: '2000px', height: '600px' }
    : { marginLeft: 0, width: '100%', minHeight: '600px', height: 'auto' };

  return (
    <div className="relative h-full w-full sm:p-2">
      <TransformWrapper
        initialScale={initialScale}
        minScale={minScale}
        maxScale={maxScale}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: false }}
        pinch={{ disabled: false }}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => {
          resetTransformRef.current = resetTransform;
          return (
            <React.Fragment>
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-semibold text-gray-700 shadow-md transition-colors hover:bg-gray-50"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-semibold text-gray-700 shadow-md transition-colors hover:bg-gray-50"
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-50"
                  title="Ajustar Vista"
                >
                  <Expand size={16} />
                </button>
              </div>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%', position: 'relative' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                <div style={contentStyle}>{children}</div>
              </TransformComponent>
            </React.Fragment>
          );
        }}
      </TransformWrapper>
    </div>
  );
};

export default MapContainer;
