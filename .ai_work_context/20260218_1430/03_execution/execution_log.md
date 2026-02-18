# Log de implementación

Registro de pasos ejecutados por fase.

## Fase 1
- Creado `cmr.types.js` (JSDoc CmrData + defaultCmrData).
- Creado `cmr.copy-config.js` (4 copias: sender, consignee, carrier, extra).
- Creado `cmr-print.css` (A4, .cmr-page, .cmr-grid, @page, @media print).
- Creado `CmrCopy.jsx` (encabezado parametrizable, rejilla 24 celdas, --cmr-color).

## Fase 2
- Creado `CmrForm.jsx`: inputs por secciones (1–4, 5–9, 11–14, 16–21, 22–24), value/onChange controlado desde el padre.

## Fase 3
- Creado `CmrPreview.jsx`: id="cmr-print-area", renderiza 4× CmrCopy con cmrCopyConfig.

## Fase 4
- Verificado cmr-print.css: @page A4, .cmr-page page-break-after, último hijo auto. Estilos se clonan al iframe vía usePrintElement (head).

## Fase 5
- Creado `CmrManualEditor.jsx`: estado defaultCmrData, CmrForm + CmrPreview, usePrintElement({ id: 'cmr-print-area', freeSize: true }), botón Imprimir.
- Creado `src/app/admin/cmr-manual/page.js` que renderiza CmrManualEditor.
- Añadida entrada "CMR Manual" en navigationManagerConfig (FileText, href /admin/cmr-manual, roles administrador/direccion/tecnico).
