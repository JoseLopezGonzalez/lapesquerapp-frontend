'use client';

import { useRef, useState, useEffect } from 'react';
import { cmrCopyConfig } from './cmr.copy-config';
import CmrCopy from './CmrCopy';

/** A4 en px (96dpi): 210mm, 297mm */
const A4_WIDTH_PX = 210 * (96 / 25.4);
const A4_HEIGHT_PX = 297 * (96 / 25.4);
const GAP_PX = 16;
const TOTAL_HEIGHT_PX = 4 * A4_HEIGHT_PX + 3 * GAP_PX;

/**
 * Contenedor del área imprimible: 4 páginas A4 (4× CmrCopy) con id para usePrintElement.
 * Escala al ancho disponible para evitar scroll horizontal.
 */
export default function CmrPreview({ data }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const s = Math.min(1, w / A4_WIDTH_PX);
      setScale(s);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-0 overflow-auto flex justify-center items-start">
      <div
        className="cmr-preview-scaled"
        style={{
          width: A4_WIDTH_PX * scale,
          height: TOTAL_HEIGHT_PX * scale,
        }}
      >
        <div
          className="cmr-preview-scale-inner"
          style={{
            width: A4_WIDTH_PX,
            height: TOTAL_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div id="cmr-print-area" className="flex flex-col gap-4">
            {cmrCopyConfig.map((config) => (
              <CmrCopy key={config.copyType} copyType={config.copyType} data={data} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
