# pallets — GAPs Registry

> **GENERADO por `node scripts/build-gaps-registry.mjs pallets`. No editar a mano.**
> Última regeneración: 2026-07-05
> Fuente: frontmatter de `docs/ai/gaps/pallets/*.md`

## Ready

| GAP | Título | Categoría | Prioridad | Riesgo | Tamaño | Dependencias | Archivos objetivo | Actualizado |
|---|---|---|---|---|---|---|---|---|
| GAP-V2-068 | Eliminar todas las cajas (desktop) no pide confirmación antes de ejecutar | ux-ui | P0 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx | 2026-07-05 |
| GAP-V2-078 | Código GS1-128 de caja usa el AI de precisión incorrecto (3100/3200 en vez de 3102/3202) — peso se decodifica 100x más pesado en lectores externos | domain-business | P0 | high | S | — | src/hooks/pallets/usePalletBoxOperations.ts<br>src/lib/gs1128Parser.js | 2026-07-05 |
| GAP-V2-058 | usePallet fetches pallet/orders/products via useEffect+useState instead of TanStack Query, causing duplicate network requests per dialog open | architecture-refactor | P1 | high | L | — | src/hooks/usePallet.ts<br>src/components/Admin/Pallets/PalletDialog/index.tsx<br>src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx | 2026-07-05 |
| GAP-V2-060 | PalletLabelDialog usa useIsMobile() sin guard para ramificar el árbol completo de render (PL-022 recurrence) | a11y-responsive | P1 | medium | S | — | src/components/Admin/Pallets/PalletLabelDialog/index.tsx | 2026-07-05 |
| GAP-V2-063 | "PalletTimeline usa <Loader/> en vez de Skeleton para la carga de datos del historial (PL-023)" | ux-ui | P1 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx | 2026-07-05 |
| GAP-V2-069 | "Deshacer cambios (desktop) no confirma, a diferencia de \"Descartar\" en mobile" | ux-ui | P1 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx | 2026-07-05 |
| GAP-V2-072 | Botones de solo icono sin nombre accesible en el visor de imágenes del palet | a11y-responsive | P1 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/ImagenesTab.tsx | 2026-07-05 |
| GAP-V2-079 | "\"Peso bruto\" por caja en el historial de trazabilidad es siempre igual al peso neto — dato fabricado, no real" | domain-business | P1 | medium | S | — | src/hooks/pallets/usePalletBoxOperations.ts<br>src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventDetail.jsx | 2026-07-05 |
| GAP-V2-080 | Alta manual y por distribución de peso promedio permiten crear cajas con peso neto 0 o negativo | domain-business | P1 | medium | S | — | src/hooks/pallets/usePalletBoxCreation.ts | 2026-07-05 |
| GAP-V2-061 | Pallet image deletion permission hardcoded and duplicated instead of centralized in lib/auth/actor | code-quality | P2 | medium | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/ImagenesTab.tsx<br>src/lib/auth/actor.ts | 2026-07-05 |
| GAP-V2-062 | PalletView/index.tsx has grown to 2829 lines — split into tab sub-components mirroring MobilePalletView | architecture-refactor | P2 | high | XL | GAP-V2-058 | src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx | 2026-07-05 |
| GAP-V2-073 | "font-semibold fuera de la escala tipográfica documentada en la vista de palet" | ux-ui | P2 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/HubScreen.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/ResumenTab.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/TaraScreen.tsx | 2026-07-05 |
| GAP-V2-074 | Uso inconsistente de style={{}} en la vista de palet — estandarizar con el patrón Tailwind ya establecido en el mismo módulo | ux-ui | P2 | low | S | — | src/components/Admin/Pallets/PalletDialog/MobilePalletView/AddManualScreen.tsx<br>src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx<br>src/components/Admin/Pallets/PalletLabelDialog/index.tsx<br>src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx<br>.claude/design-context.md | 2026-07-05 |
| GAP-V2-059 | Remove dead duplicate legacy service src/services/domain/pallets/palletService.js | code-quality | P3 | low | XS | — | src/services/domain/pallets/palletService.js | 2026-07-05 |
| GAP-V2-064 | BoxesLabels/index.js — dead date-fns import, commented-out code, index-as-key, migrate to TSX | code-quality | P3 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/BoxesLabels/index.js | 2026-07-05 |
| GAP-V2-065 | PalletView calls domain services directly instead of through a hook (deletePalletTimeline, downloadPalletExpeditionLabel, getProductionByLot) | architecture-refactor | P3 | medium | M | GAP-V2-062 | src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx | 2026-07-05 |
| GAP-V2-066 | Pallet editor validates numeric/business-rule inputs ad-hoc (parseFloat/isNaN scattered) instead of shared Zod schemas | code-quality | P3 | low | M | — | src/hooks/pallets/usePalletSave.ts<br>src/hooks/pallets/usePalletBoxCreation.ts<br>src/hooks/pallets/usePalletBoxOperations.ts | 2026-07-05 |
| GAP-V2-067 | PalletTimeline ships a hand-written .d.ts instead of native .tsx typing — migrate the sub-module to TypeScript | code-quality | P3 | low | M | — | src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx<br>src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.d.ts<br>src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventItem.jsx<br>src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/TimelineEventDetail.jsx | 2026-07-05 |
| GAP-V2-075 | InfoTab.tsx (MobilePalletView) es un componente huérfano no usado — riesgo de divergencia con Tara/Observaciones/Pedido | ux-ui | P3 | low | XS | — | src/components/Admin/Pallets/PalletDialog/MobilePalletView/InfoTab.tsx | 2026-07-05 |
| GAP-V2-082 | Tara por caja solo disponible en el modo de alta "promedio" — alta manual, masiva y por lector no permiten descontarla | domain-business | P3 | low | M | — | src/hooks/pallets/usePalletBoxCreation.ts<br>src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/AddManualScreen.tsx | 2026-07-05 |


## In progress

_ninguno_


## Blocked

_ninguno_


## Done

_ninguno_


## Later

_ninguno_


## Rejected

| GAP | Título | Categoría | Prioridad | Riesgo | Tamaño | Dependencias | Archivos objetivo | Actualizado |
|---|---|---|---|---|---|---|---|---|
| GAP-V2-070 | "ABSORBIDO en GAP-V2-063 — PalletTimeline usa <Loader/> en vez de Skeleton para la carga de datos del historial (desktop)" | ux-ui | P1 | low | S | — | src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/index.jsx | 2026-07-05 |
| GAP-V2-071 | "ABSORBIDO en GAP-V2-060 — PalletLabelDialog usa useIsMobile() sin guard para ramificar el árbol completo de render" | a11y-responsive | P1 | medium | S | — | src/components/Admin/Pallets/PalletLabelDialog/index.tsx | 2026-07-05 |
| GAP-V2-081 | Vincular un palet a un pedido no valida ni advierte si el producto de las cajas no coincide con ninguna línea del pedido | domain-business | P2 | low | M | — | src/hooks/pallets/usePalletBoxOperations.ts<br>src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/InfoTab.tsx<br>src/components/Admin/Pallets/PalletDialog/MobilePalletView/PedidoScreen.tsx | 2026-07-05 |


