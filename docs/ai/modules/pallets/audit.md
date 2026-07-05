# Pallets (Palets) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Todos los bloqueos resueltos (2026-07-05): Jose respondió las 7 preguntas
pendientes (ver § 10). Registry regenerado: 20 ready, 0 blocked, 0 done,
0 later, 3 rejected.

Ejecutar (orden recomendado, por severidad real):

1. /implement-next module=pallets category=domain-business limit=1 risk=high
   → GAP-V2-078 (AI GS1-128 incorrecto, peso decodificado x100 por lectores
     externos — impacto físico real, no solo interno)

2. /implement-next module=pallets category=ux-ui limit=1 risk=low
   → GAP-V2-068 (Eliminar todas las cajas sin confirmación en desktop)

3. GAP-V2-058 (L) en PR aislado, seguido de GAP-V2-062 (XL, depende de 058) y
   GAP-V2-065 (depende de 062) — cada uno su propio PR, sin mezclar con otros
   GAPs (protocolo reforzado de CLAUDE.md, historial PL-BUILD-05 en este mismo
   archivo).

4. Resto de los GAPs ready pequeños (ver gaps-registry.md) por lotes de
   category+risk=low/medium.
```

---

## 1. Estado del módulo

```text
Estado general: ready_for_implementation (tras normalizar)

Funcional:        needs_review
UI:                needs_review
UX:                 needs_review
Código:              needs_review
Arquitectura:         needs_review
Responsive:            needs_review
Accesibilidad:           needs_review
Performance:               not_started
Testing:                     needs_review (deuda ya documentada, sin GAP nuevo)
Documentación:                 needs_review

P0 abiertos: 2   P1 abiertos: 7   P2 abiertos: 4   P3 abiertos: 7

Estado de auditoría:      done (pasada 1, alcance: creación/edición)
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
| creación (desktop) | audited | audited | audited | not_applicable | audited | audited |
| edición (desktop) | audited | audited | audited | not_applicable | audited | audited |
| creación/edición (mobile) | audited | audited | audited | not_applicable | audited | audited |
| formularios | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| box management (crear/editar/duplicar/eliminar caja) | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| tara/formato | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| vinculación a pedido (desde el palet) | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| imágenes/adjuntos | audited | audited | not_applicable | not_applicable | not_applicable | audited |
| impresión de etiqueta | audited | audited | not_applicable | not_applicable | audited | audited |
| estados loading | audited | audited | not_applicable | not_applicable | not_applicable | not_applicable |
| estados empty | audited | audited | not_applicable | not_applicable | not_applicable | not_applicable |
| estados error | partial | audited | not_applicable | not_applicable | not_applicable | not_applicable |
| validaciones | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| permisos/roles (gating de campos de coste) | not_applicable | audited | not_applicable | not_applicable | not_applicable | not_applicable |
| integración API (palletService) | not_applicable | audited | audited | not_applicable | not_applicable | not_applicable |
| tipos/interfaces | not_applicable | audited | audited | not_applicable | not_applicable | not_applicable |
| componentización (`PalletView` 2829 líneas) | not_applicable | audited | audited | not_applicable | not_applicable | not_applicable |
| testing | not_applicable | audited | not_applicable | not_applicable | not_applicable | not_applicable |
| listado | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable |
| responsive/a11y | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | audited |

Nota: `ui-audit-agent` cubre `ux-ui` y `a11y-responsive`; se ha marcado
`a11y-responsive` como `audited` solo en la fila dedicada para no duplicar filas.
`data-api` queda `not_applicable` en toda la tabla porque no se lanzó
`permissions-multitenant-auditor` en esta pasada (ver § 9, flag pendiente sobre
visibilidad de campos de coste en el GET inicial).

## 3. Resumen ejecutivo

Primera auditoría v2 de `pallets`, acotada a la pantalla de creación/edición (desktop
`PalletView` + mobile `MobilePalletView`). 3 carriles ejecutados en paralelo
(code-audit-agent, ui-audit-agent, domain-business-auditor), 22 GAP candidates escritos.

Dos hallazgos P0 con impacto real fuera del código: (1) el código de barras GS1-128
impreso en la etiqueta física de la caja usa el Application Identifier de precisión
incorrecto (3100/3200 en vez de 3102/3202), por lo que cualquier lector GS1-128 externo
estándar (cliente, transportista, carretilla) decodificaría el peso ×100 — bug de
dominio con consecuencia física real, no solo interno; (2) "Eliminar todas las cajas"
en desktop ejecuta sin confirmación, a diferencia de mobile que sí la pide — riesgo de
pérdida de datos por un solo clic.

Patrón transversal detectado por 2 carriles distintos de forma independiente:
`PalletView/index.tsx` (2829 líneas, creció de ~1100 tras GAP-039) es monolítico y
diverge del patrón correctamente modularizado de `MobilePalletView/*` — mismo síntoma
visto desde código (arquitectura) y desde UX (desktop y mobile no comparten los mismos
guardrails de confirmación/loading, ver GAP-V2-062/068/069/070).

Pendiente: normalizar los 22 candidatos (Fase 6) y regenerar el registry (Fase 7).

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

**domain-business-auditor (5):**
- GS1-128 usa AI de precisión incorrecto (3100/3200 vs 3102/3202) — peso decodificado
  ×100 por lectores externos. `usePalletBoxOperations.ts:73-88`. P0.
- "Peso bruto" por caja en el historial es siempre = peso neto (dato fabricado).
  `usePalletBoxOperations.ts:108-114,129-135`, `TimelineEventDetail.jsx:82-83,475-479`. P1.
- Alta manual y por distribución de peso promedio permiten peso neto 0/negativo,
  inconsistente con la validación correcta del modo masivo. `usePalletBoxCreation.ts:74-131`. P1.
- Vincular palet a pedido no valida coincidencia producto-pedido. `usePalletBoxOperations.ts:497-500`. P2.
- Tara por caja solo disponible en modo "promedio". P3, depende de GAP-V2-079.

**ui-audit-agent (8):**
- "Eliminar todas las cajas" (desktop) sin confirmación, a diferencia de mobile.
  `PalletView/index.tsx:2601-2609` vs `EliminarTab.tsx:87-115`. P0.
- "Deshacer" (desktop) no confirma, a diferencia de "Descartar" en mobile.
  `PalletView/index.tsx:2755-2761`. P1.
- `PalletTimeline` usa `<Loader>` en vez de `Skeleton` (desktop, historial).
  `PalletTimeline/index.jsx:11-18` vs `HistorialTab.tsx:30-35`. P1.
- `PalletLabelDialog` usa `useIsMobile()` sin guard para ramificar el render completo. P1.
- Botones de solo icono sin nombre accesible en el visor de imágenes. P1.
- `font-semibold` fuera de la escala tipográfica documentada. P2.
- Uso inconsistente de `style={{}}`. P2.
- `InfoTab.tsx` (mobile) huérfano, sin imports. P3.

**code-audit-agent (9):**
- `usePallet` fetch vía `useState`+`useEffect` (no TanStack Query), llamado 3× por
  apertura de diálogo → peticiones duplicadas. `usePallet.ts:44-148`. P1, risk high.
- Servicio legacy duplicado y muerto `domain/pallets/palletService.js`. P3.
- `PalletLabelDialog` usa `useIsMobile()` sin guard (mismo hallazgo que ui-audit-agent
  desde ángulo de arquitectura — candidato a fusión en normalización). P2.
- Permiso de borrado de imagen hardcodeado y duplicado, no centralizado en `lib/auth/actor`. P2.
- `PalletView` monolítico, 2829 líneas — dividir por tab como `MobilePalletView`. P2, size XL.
- `PalletTimeline` usa `<Loader>` (mismo hallazgo que ui-audit-agent) + `.jsx`/`.d.ts`
  manual en vez de `.tsx` nativo. P2.
- `BoxesLabels/index.js`: import muerto, código comentado, `index` como key, migrar a TSX. P3.
- `PalletView` llama a servicios directamente, sin pasar por la capa de hooks. P3.
- Validación numérica ad-hoc (sin Zod compartido) en el editor de palet. P3.

## 7. GAPs generados/actualizados

Rangos de numeración reservados para esta pasada:

```text
code-audit-agent          → GAP-V2-058 .. GAP-V2-067
ui-audit-agent              → GAP-V2-068 .. GAP-V2-077
domain-business-auditor        → GAP-V2-078 .. GAP-V2-087
```

Tras `gap-normalizer` (22 candidatos → 21 GAPs finales, ver `gaps-registry.md` para
el detalle completo):

**Fusiones:**
- GAP-V2-060 (code-audit-agent) + GAP-V2-071 (ui-audit-agent) → único GAP en
  GAP-V2-060 (`PalletLabelDialog` `useIsMobile()` sin guard), categoría final
  `a11y-responsive`, P1, `ready`. GAP-V2-071 reescrito como `rejected` (absorbido).
- GAP-V2-063 (code-audit-agent) + GAP-V2-070 (ui-audit-agent) → único GAP en
  GAP-V2-063 (`PalletTimeline` usa `<Loader>` en vez de `Skeleton`), categoría
  `ux-ui`, P1, `ready`. GAP-V2-070 reescrito como `rejected` (absorbido).

**División:** GAP-V2-063 original mezclaba 2 problemas — se separó la parte de
migración `.jsx`→`.tsx` (con `.d.ts` manual) en un GAP nuevo: GAP-V2-067
(`PalletTimeline` migración a TSX nativo), `code-quality`, P3, `ready`.

**Ready (20, tras resolver los 7 blocked el 2026-07-05):** GAP-V2-058, 059, 060,
061, 062, 063, 064, 065, 066, 067, 068, 069, 072, 073, 074, 075, 078, 079, 080, 082.

**Rejected (3):**
- GAP-V2-070, GAP-V2-071 — absorbidos por fusión en GAP-V2-063 y GAP-V2-060
  respectivamente (no son hallazgos descartados).
- GAP-V2-081 — decisión de negocio de Jose: vincular un palet a un pedido sin
  coincidencia de producto es comportamiento intencional (sustitución/
  reasignación legítima), no un bug. No reabrir sin evidencia de que la
  decisión de producto cambió.

Ver § 10 para el detalle de cada decisión que desbloqueó los 7 GAPs.

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
- **Duplicados entre carriles a resolver en normalización (Fase 6):** `PalletLabelDialog`
  usa `useIsMobile()` sin guard fue reportado tanto por code-audit-agent (GAP-V2-060)
  como por ui-audit-agent (GAP-V2-071) — mismo bug, dos ángulos. Igual con `PalletTimeline`
  usando `<Loader>` en vez de `Skeleton` (GAP-V2-063 y GAP-V2-070). `gap-normalizer` debe
  fusionarlos en un único GAP cada uno.
- **Flag de domain-business-auditor sin GAP propio:** `stripPalletCostFieldsFromPayload`
  solo se aplica en el payload de guardado (`usePalletSave.ts:53-55`); no se verificó si
  el GET inicial del palet ya oculta campos de coste a nivel de backend para roles sin
  permiso. Esto es competencia de `permissions-multitenant-auditor`, no lanzado en esta
  pasada — considerar para una futura pasada si Jose lo prioriza.
- ~~3 preguntas de domain-business-auditor pendientes de respuesta de Jose~~ —
  resueltas el 2026-07-05, ver § 10.

## 10. Decisiones tomadas

- 2026-07-05 — Jose confirma alcance: creación/edición (desktop + mobile), formularios,
  box management, tara/formato, vinculación a pedido desde el palet, imágenes/adjuntos,
  impresión de etiqueta, estados loading/empty/error, validaciones. Fuera de alcance:
  listado, movimientos de almacén, vinculación masiva desde `useOrderPallets`.
- 2026-07-05 — Jose confirma carriles: los 3 por defecto del piloto (code-audit-agent,
  ui-audit-agent, domain-business-auditor). No se añade permissions-multitenant-auditor
  ni design-quality-auditor en esta pasada.
- 2026-07-05 — Jose resuelve los 7 `blocked` de la normalización:
  1. **GAP-V2-058 (L) y GAP-V2-062 (XL, + GAP-V2-065 en cascada):** autorizados
     ambos. Implementar en PRs aislados, GAP-V2-058 primero (GAP-V2-062 depende
     de él).
  2. **GAP-V2-061 (rol para borrar imágenes de palet):** mismo conjunto que
     `canManagePalletCostFields` (administrador/dirección/técnico) — amplía el
     acceso actual, que excluía incorrectamente a dirección.
  3. **GAP-V2-079 (peso bruto por caja):** Opción A — eliminar el campo del
     historial de trazabilidad a nivel de caja individual (queda solo a nivel
     de palet, donde sí es real).
  4. **GAP-V2-081 (validación producto-pedido al vincular):** no existe
     validación backend, y la lógica de negocio permite deliberadamente
     vincular un palet a un pedido sin producto coincidente (sustitución/
     reasignación legítima) — GAP rechazado, es comportamiento intencional.
  5. **GAP-V2-082 (tara en modo manual):** se mantiene como mejora de UX,
     re-scopeada para no depender ya de GAP-V2-079 (con Opción A, la mejora de
     tara sigue siendo válida por sí misma). Tara variable caja a caja, sin
     catálogo de envase ni memoria de sesión entre altas.

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
