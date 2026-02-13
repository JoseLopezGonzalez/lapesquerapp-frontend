# Bundle y dependencias

**Estado**: ✅ Completado  
**Última actualización**: 2026-02-13

## Métricas de build

- **Chunks estáticos totales**: ~9.2 MB (`.next/static/chunks`)
- **Chunks individuales destacados** (ejemplos):
  - `1fac7e3ddeaeaa70.js` ~155 KB
  - `3970cfc20a0a284a.js` ~121 KB
  - `155020d7ed5e03b0.js` ~116 KB
  - `23cc1fb0d08d8547.js` ~106 KB
  - `05f6e06170f6344b.js` ~95 KB

## Dependencias pesadas

| Paquete | Uso típico | Impacto |
|---------|------------|---------|
| recharts | Gráficos dashboard | Alto — tree-shaking limitado |
| xlsx | Exportación Excel | Alto — librería grande |
| jspdf | PDFs | Medio |
| html2canvas | Captura DOM para PDF | Medio |
| framer-motion | Animaciones | Medio — tree-shaking parcial |
| @xyflow/react (React Flow) | Orquestador/diagramas | Alto |
| dagre | Layout de grafos | Medio |
| react-zoom-pan-pinch | Mapas/zoom | Medio |
| lottie-web | Animaciones Lottie | Medio |
| @nextui-org/react | UI components | Medio — coexiste con shadcn |

## Code splitting

### dynamic() y lazy()

- **Order component**: 9 `lazy()` para pestañas (OrderPallets, OrderDocuments, OrderExport, etc.) ✅ bueno.
- **ReceptionPrintDialog**, **PalletDialog**, **ReceptionSummaryDialog**, etc.: `dynamic()` con `ssr: false` en algunos casos.
- **Falta**: muchas rutas pesadas no usan `dynamic()` en la página (Dashboard, EntityClient, etc.).

### Carga de rutas

- Next.js hace code-splitting por ruta de forma automática.
- Riesgo: rutas como `/admin/orquestador` (React Flow + dagre) y `/admin/market-data-extractor` pueden cargar bundles muy grandes en la primera visita.
