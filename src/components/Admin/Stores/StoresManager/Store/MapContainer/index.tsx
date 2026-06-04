'use client';

import React, { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Expand } from 'lucide-react';

interface MapContainerProps {
  children: React.ReactNode;
  isMobile?: boolean;
}

// SVG viewBox is -100 -100 10000 3000  →  effective ratio 10000 / 3000 ≈ 3.334
const VIEWBOX_RATIO = 10000 / 3000;
// Store-detail header + any system chrome (approx.)
const HEADER_OFFSET_PX = 112;

const MapContainer = ({ children, isMobile = false }: MapContainerProps) => {
  // Use measured viewport height on mobile so the map fills the screen exactly.
  // Start with a sensible SSR / pre-measure value to avoid hydration mismatch.
  const [canvasH, setCanvasH] = useState(700);

  useEffect(() => {
    if (isMobile) {
      setCanvasH(Math.max(window.innerHeight - HEADER_OFFSET_PX, 400));
    }
  }, [isMobile]);

  const canvasW = Math.round(canvasH * VIEWBOX_RATIO);

  if (isMobile) {
    return (
      <div style={{ width: '100%', height: `${canvasH}px`, overflow: 'hidden', position: 'relative' }}>
        <TransformWrapper
          initialScale={1}
          minScale={0.2}
          maxScale={8}
          centerOnInit={false}
          wheel={{ step: 0.1 }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, centerView }) => (
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
                  onClick={() => centerView(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-50"
                  title="Ajustar Vista"
                >
                  <Expand size={16} />
                </button>
              </div>
              {/* wrapperStyle = visible viewport; contentStyle/inner div = full canvas */}
              <TransformComponent
                wrapperStyle={{ width: '100%', height: `${canvasH}px`, position: 'relative', overflow: 'hidden' }}
                contentStyle={{ display: 'block' }}
              >
                <div style={{ width: `${canvasW}px`, height: `${canvasH}px` }}>
                  {children}
                </div>
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </div>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full sm:p-2">
      <TransformWrapper
        initialScale={1.2}
        minScale={0.3}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
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
              <div style={{ marginLeft: 0, width: '100%', minHeight: '600px', height: 'auto' }}>
                {children}
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default MapContainer;
