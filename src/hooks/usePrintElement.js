import { useCallback } from 'react';

export function usePrintElement({ id, width = 100, height = 150, freeSize = false }) {
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

    // Copiar head con estilos incluidos
    const headContent = document.head.cloneNode(true);
    doc.head.innerHTML = '';
    [...headContent.querySelectorAll("style, link[rel='stylesheet']")].forEach((el) => {
      doc.head.appendChild(el.cloneNode(true));
    });

    // @page margin: 0 siempre activo; size solo cuando !freeSize
    const pageSizeCss = freeSize
      ? '@page { margin: 0; }'
      : `@page { size: ${width}mm ${height}mm; margin: 0; }`;
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
    const printStyle = document.createElement('style');
    printStyle.textContent = `
      ${pageSizeCss}
      @media print {
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

    // Forzar visibilidad: no depender de que Tailwind print:block funcione en el iframe
    const printAreaInIframe = doc.getElementById(id);
    if (printAreaInIframe) printAreaInIframe.style.display = 'block';

    // Esperar a que se cargue todo y luego imprimir
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 500);
  }, [id, width, height, freeSize]);

  return { onPrint };
}
