import { useCallback } from 'react';

export function usePrintElement({ id, width = 100, height = 150 }) {
    const onPrint = useCallback(() => {
        const target = document.getElementById(id);
        if (!target) return;

        // Crear contenedor temporal con el contenido a imprimir
        const tempContainer = document.createElement('div');
        tempContainer.id = 'print-temp-container';
        tempContainer.innerHTML = target.outerHTML;
        document.body.appendChild(tempContainer);

        // Inyectar estilos de impresión
        const style = document.createElement('style');
        style.textContent = `
      @media print {
        @page {
          size: ${width}mm ${height}mm;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
        }

        body * {
          visibility: hidden !important;
        }

        #print-temp-container, #print-temp-container * {
          visibility: visible !important;
        }

        #print-temp-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          z-index: 9999;
        }

        #print-temp-container > * {
          width: ${width}mm;
          height: ${height}mm;
          overflow: hidden;
          page-break-after: avoid;
        }

        .no-print {
          display: none !important;
        }
      }
    `;
        document.head.appendChild(style);

        // Ejecutar impresión
        window.print();

        // Limpiar después de imprimir
        setTimeout(() => {
            document.body.removeChild(tempContainer);
            document.head.removeChild(style);
        }, 100);
    }, [id, width, height]);

    return { onPrint }

}
