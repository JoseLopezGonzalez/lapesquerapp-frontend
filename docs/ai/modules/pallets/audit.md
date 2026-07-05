# Pallets (Palets) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Pasada 1 en curso: 3 carriles lanzados (code-audit-agent, ui-audit-agent,
domain-business-auditor) sobre la pantalla de creación/edición de palet
(desktop PalletView + mobile MobilePalletView).

Tras el merge de esta pasada: normalizar candidatos y regenerar el registry.
```

---

## 1. Estado del módulo

```text
Estado general: auditing

Funcional:        not_started
UI:                not_started
UX:                 not_started
Código:              not_started
Arquitectura:         not_started
Responsive:            not_started
Accesibilidad:           not_started
Performance:               not_started
Testing:                     not_started
Documentación:                 not_started

P0 abiertos: 0   P1 abiertos: 0   P2 abiertos: 0   P3 abiertos: 0

Estado de auditoría:      in_progress
Estado de implementación: not_started
Estado de verificación:   not_started
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

Alcance de esta pasada: pantalla de **creación/edición de palet** (desktop + mobile).
Fuera de alcance: listado de palets, movimientos de almacén (assign/move position),
vinculación masiva desde el lado del pedido (`useOrderPallets`).

| Superficie | ux-ui | code-quality | architecture-refactor | data-api | domain-business | a11y-responsive |
|---|---|---|---|---|---|---|
| creación (desktop) | pending | pending | pending | not_applicable | pending | not_applicable |
| edición (desktop) | pending | pending | pending | not_applicable | pending | not_applicable |
| creación/edición (mobile) | pending | pending | pending | not_applicable | pending | not_applicable |
| formularios | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| box management (crear/editar/duplicar/eliminar caja) | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| tara/formato | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| vinculación a pedido (desde el palet) | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| imágenes/adjuntos | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| impresión de etiqueta | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| estados loading | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| estados empty | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| estados error | pending | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| validaciones | pending | pending | not_applicable | not_applicable | pending | not_applicable |
| permisos/roles (gating de campos de coste) | not_applicable | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| integración API (palletService) | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| tipos/interfaces | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| componentización (`PalletView` 2829 líneas) | not_applicable | pending | pending | not_applicable | not_applicable | not_applicable |
| testing | not_applicable | pending | not_applicable | not_applicable | not_applicable | not_applicable |
| listado | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable |
| responsive/a11y | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | pending |

Nota: `ui-audit-agent` cubre `ux-ui` y `a11y-responsive`; se ha marcado
`a11y-responsive` como `pending` solo en la fila dedicada para no duplicar filas.

## 3. Resumen ejecutivo

{se rellena tras el merge de la Fase 5}

## 4. Baseline anterior

Ninguna — primera auditoría del módulo `pallets` en la capa v2 (`docs/ai/`).
Existe historial legacy relevante en `.claude/gaps/closed/` (ver § Legacy references).

## 5. Alcance del módulo

```text
Rutas:
  src/app/admin/pallets/create/page.js + PalletCreateClient.js
  src/app/admin/pallets/[id]/page.js + PalletClient.js
  src/app/admin/pallets/loading.js

Componentes (desktop):
  src/components/Admin/Pallets/PalletDialog/PalletView/index.tsx (2829 líneas —
    candidato fuerte a "componente gigante"; historial de @ts-nocheck, ver PL-016/PL-018)
  src/components/Admin/Pallets/PalletDialog/index.tsx (290 líneas — wrapper Dialog)
  src/components/Admin/Pallets/PalletDialog/PalletView/BoxesLabels/index.js
  src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx
  src/components/Admin/Pallets/PalletDialog/PalletView/PalletTimeline/*
  src/components/Admin/Pallets/PalletDialog/PalletView/SummaryPieChart/index.js
  src/components/Admin/Pallets/PalletAttachments/{PalletImageStrip,PalletLightboxDialog,
    PalletQuickImagesDialog,PalletUploadDialog}.tsx
  src/components/Admin/Pallets/PalletLabel/index.js
  src/components/Admin/Pallets/PalletLabelDialog/index.tsx

Componentes (mobile):
  src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx (427 líneas)
  src/components/Admin/Pallets/PalletDialog/MobilePalletView/{HubScreen,InfoTab,
    BoxesTab,TaraScreen,PedidoScreen,AddManualScreen,ImagenesTab,ObservacionesScreen,
    HistorialTab,EliminarTab,ResumenTab}.tsx

Hooks:
  src/hooks/usePallet.ts (302 líneas — orquestador, ya migrado/refactorizado)
  src/hooks/pallets/palletHelpers.ts (224 líneas — tipos PalletBox/PalletState + helpers)
  src/hooks/pallets/usePalletBoxCreation.ts (379 líneas)
  src/hooks/pallets/usePalletBoxOperations.ts (535 líneas — el sub-hook más grande)
  src/hooks/pallets/usePalletSave.ts (126 líneas)
  src/hooks/pallets/usePalletAttachments.ts (184 líneas)
  src/hooks/pallets/usePalletScannerEffects.ts (54 líneas)
  src/hooks/usePalletTimeline.ts

Services:
  src/services/palletService.ts (620 líneas — el usado por los hooks)
  src/services/domain/pallets/palletAttachmentService.ts (196 líneas)
  src/services/domain/pallets/palletService.js (96 líneas — posible duplicado/legacy,
    verificar si está muerto o si hay confusión de import)

Tipos:
  Sin pallet.ts dedicado — tipos inline en hooks/pallets/palletHelpers.ts
  (PalletBox, PalletState) y src/types/production.ts (BoxNormalized)

Tests:
  src/components/Admin/Pallets/PalletLabel/__tests__/palletLabelQrPayload.test.js
  (único test relacionado con el módulo — sin cobertura de PalletView/usePallet/box hooks)
```

## 6. Hallazgos vigentes

{se rellena tras el merge de la Fase 5}

## 7. GAPs generados/actualizados

Rangos de numeración reservados para esta pasada:

```text
code-audit-agent          → GAP-V2-058 .. GAP-V2-067
ui-audit-agent              → GAP-V2-068 .. GAP-V2-077
domain-business-auditor        → GAP-V2-078 .. GAP-V2-087
```

{lista final tras normalizar, Fase 6}

## 8. GAPs resueltos o descartados

{ninguno todavía}

## 9. Bloqueos y riesgos

- `PalletView/index.tsx` ha crecido de ~1100 líneas (post GAP-039) a 2829 líneas —
  regresión de tamaño sobre un archivo ya señalado como de riesgo alto (PL-016, PL-018,
  PL-BUILD-05). Verificar si sigue libre de `@ts-nocheck` y si el riesgo de cascada de
  tipos aplica a cualquier refactor futuro.
- Posible servicio duplicado: `src/services/palletService.ts` (620 líneas, usado por
  los hooks) vs `src/services/domain/pallets/palletService.js` (96 líneas). Confirmar
  con code-audit-agent cuál está realmente muerto antes de proponer su eliminación.
- Sin schemas Zod en el flujo de creación/edición de palet (validación manual) —
  posible inconsistencia con el patrón React Hook Form + Zod del resto del proyecto.
- Sin tests para `PalletView`, `usePallet` ni los hooks de cajas — coherente con la
  deuda técnica #4 documentada en `CLAUDE.md`, no es un hallazgo nuevo.

## 10. Decisiones tomadas

- 2026-07-05 — Jose confirma alcance: creación/edición (desktop + mobile), formularios,
  box management, tara/formato, vinculación a pedido desde el palet, imágenes/adjuntos,
  impresión de etiqueta, estados loading/empty/error, validaciones. Fuera de alcance:
  listado, movimientos de almacén, vinculación masiva desde `useOrderPallets`.
- 2026-07-05 — Jose confirma carriles: los 3 por defecto del piloto (code-audit-agent,
  ui-audit-agent, domain-business-auditor). No se añade permissions-multitenant-auditor
  ni design-quality-auditor en esta pasada.

## 11. Cambios desde la última auditoría

No aplica — primera auditoría v2 del módulo.

## 12. Instrucciones para retomar en otro chat/modelo

Esta es la primera pasada v2 sobre `pallets`. El alcance de esta pasada es solo la
pantalla de creación/edición (ver § 5). El listado de palets y las integraciones desde
`orders` (`useOrderPallets`) quedan fuera — no asumir que ya están auditadas.

## 13. Reglas específicas para futuras auditorías de este módulo

- `PalletView/index.tsx` es el archivo más grande y de mayor riesgo del módulo —
  cualquier auditoría de código debe revisar primero si mantiene `@ts-nocheck` y su
  tamaño actual antes de proponer cambios.
- Existen dos vistas completamente separadas (desktop `PalletView` vs mobile
  `MobilePalletView`) que pueden divergir en lógica y copy — verificar consistencia
  entre ambas en auditorías de UX.

## Legacy references

| Legacy GAP (`.claude/gaps/`) | Estado legacy | Relación | Nota |
|---|---|---|---|
| GAP-005-refactor-usepallet-extract-sub-hooks.md | closed | usePallet | Refactor a sub-hooks ya aplicado — baseline de esta auditoría |
| GAP-039-remove-ts-nocheck-palletview.md | closed | PalletView | Quitó `@ts-nocheck`; verificar que sigue sin él tras crecer a 2829 líneas |
| GAP-072-pallet-hooks-token-interno.md | closed | hooks/pallets | Patrón token-as-parameter aplicado |
| GAP-073-label-editor-token-interno.md | closed | label editor | Relacionado, no core de esta pantalla |
| GAP-074-usepallettimeline-tanstack-query.md | closed | usePalletTimeline | Migración a TanStack Query ya aplicada |
| GAP-075-label-editor-property-panel-heroicons.md | closed | label editor | Relacionado, no core |
| GAP-076-pallet-exhaustive-deps-cleanup.md | closed | hooks/pallets | exhaustive-deps ya limpiado |
| GAP-077-pallet-label-editor-quick-fixes.md | closed | PalletLabel | Quick fixes ya aplicados |
| GAP-089-order-pallets-row-actions-dropdown.md | closed | OrderPallets | Fuera de alcance (integración desde orders) |
| GAP-109-palletcard-badge-variant.md | closed | PalletCard | Verificar si `PalletCard` es parte de listado (fuera de alcance) |
