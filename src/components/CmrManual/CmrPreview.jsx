'use client';

import { cmrCopyConfig } from './cmr.copy-config';
import CmrCopy from './CmrCopy';

/**
 * Contenedor del área imprimible: 4 páginas A4 (4× CmrCopy) con id para usePrintElement.
 * Cada copia usa el mismo data y su copyType (sender, consignee, carrier, extra).
 */
export default function CmrPreview({ data }) {
  return (
    <div id="cmr-print-area" className="flex flex-col gap-4">
      {cmrCopyConfig.map((config) => (
        <CmrCopy key={config.copyType} copyType={config.copyType} data={data} />
      ))}
    </div>
  );
}
