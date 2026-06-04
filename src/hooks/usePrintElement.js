import { useCallback } from 'react';

export function usePrintElement({
  id,
  width = 100,
  height = 150,
  freeSize = false,
  minimalStyles = false,
}) {
  const onPrint = useCallback(() => {
    const elementToPrint = document.getElementById(id);
    if (!elementToPrint) return;

    // Crear iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.head.innerHTML = '';

    if (!minimalStyles) {
      const headContent = document.head.cloneNode(true);
      [...headContent.querySelectorAll("style, link[rel='stylesheet']")].forEach((el) => {
        doc.head.appendChild(el.cloneNode(true));
      });
    }

    // Estilos de impresión: freeSize omite @page size para que el contenido se ajuste al formato nativo
    const pageSizeCss = freeSize
      ? ''
      : `
        @page {
          size: ${width}mm ${height}mm;
          margin: 0;
        }
      `;
    const pageClassCss = freeSize
      ? ''
      : `
        .page {
          width: ${width}mm;
          height: ${height}mm;
          overflow: hidden;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .page:last-child {
          page-break-after: auto;
        }
      `;
    const minimalLayoutCss = minimalStyles
      ? `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: ${width}mm !important;
          max-width: ${width}mm !important;
          min-width: ${width}mm !important;
          overflow: hidden !important;
          background: white !important;
        }
        #${id} {
          display: block !important;
          visibility: visible !important;
          width: ${width}mm !important;
          max-width: ${width}mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #${id} .page {
          width: ${width}mm !important;
          height: ${height}mm !important;
          max-width: ${width}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          page-break-after: always;
          page-break-inside: avoid;
        }
        #${id} .page:last-child {
          page-break-after: auto;
        }
      `
      : '';
    const printStyle = document.createElement('style');
    printStyle.textContent = `
      ${minimalLayoutCss}
      @media print {
        ${pageSizeCss}
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        ${pageClassCss}
      }
    `;
    doc.head.appendChild(printStyle);

    // Copiar contenido
    doc.body.innerHTML = elementToPrint.outerHTML;

    // Esperar a que se cargue todo y luego imprimir
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 500);
  }, [id, width, height, freeSize, minimalStyles]);

  return { onPrint };
}
