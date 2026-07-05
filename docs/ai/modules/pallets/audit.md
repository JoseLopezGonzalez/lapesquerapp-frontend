# Pallets (Palets) — Auditoría

> Única fuente de estado de este módulo. No crear `audit-v2.md`, `audit-final.md`
> ni variantes con fecha — este archivo se actualiza in-place en cada pasada.

## NEXT ACTION

```text
Segunda pasada normalizada y mergeada (2026-07-05), y los 6 `blocked` resueltos
por Jose (2026-07-06, ver § 10): registry final del módulo (2 pasadas): **42
ready, 1 blocked, 0 done, 0 later, 5 rejected**. Solo queda 1 GAP bloqueado
(GAP-V2-105, filtro de disponibilidad de stock — pendiente de verificar si el
backend lo soporta antes de poder implementarlo). Todo lo demás ya puede pasar
a `/implement-next`.

Ejecutar (orden recomendado, por severidad real):

1. /implement-next module=pallets category=domain-business limit=1 risk=high
   → GAP-V2-078 (AI GS1-128 incorrecto, peso decodificado x100 por lectores
     externos — impacto físico real, no solo interno). Encadenar con
     GAP-V2-109 (mismo bug, archivo distinto, dependiente de 078).

2. /implement-next module=pallets category=ux-ui limit=1 risk=low
   → GAP-V2-068 (Eliminar todas las cajas sin confirmación en desktop)

3. GAPs grandes (L/XL) autorizados por Jose, cada uno en PR aislado, respetando
   dependencias: GAP-V2-058 → GAP-V2-062 → GAP-V2-065 (cadena de la primera
   pasada); GAP-V2-085 → GAP-V2-087 (cadena de la segunda pasada, movimientos de
   almacén); GAP-V2-088 → GAP-V2-089 (cadena de la segunda pasada, split de
   `useOrderPallets` de `OrderPallets`).

4. Resto de los 42 GAPs `ready` (ver gaps-registry.md) por lotes de
   category+risk=low/medium.

5. GAP-V2-105 sigue `blocked` — antes de tomarlo, verificar contra la API real
   (`GET /api/v2/pallets`) si el backend soporta filtrar por disponibilidad de
   stock; si no, no es implementable solo en frontend (ver notas del propio
   GAP).
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

P0 abiertos: 3   P1 abiertos: 13   P2 abiertos: 15   P3 abiertos: 10   P4 abiertos: 2
(cuenta tras 2 pasadas + resolución de blocked del 2026-07-06: ready + blocked,
excluye rejected — ver gaps-registry.md)

Estado de auditoría:      done (pasada 1: creación/edición · pasada 2: listado,
                           movimientos de almacén, vinculación masiva desde pedido)
Estado de implementación: not_started
Estado de verificación:   not_started
```

## 2. Cobertura

Superficies × carriles. Estados: `pending · partial · audited · needs_reaudit · not_applicable`.

Alcance pasada 1: pantalla de **creación/edición de palet** (desktop + mobile).
Alcance pasada 2 (2026-07-05): **listado de palets** (acotado a config específica
de pallets, no el motor genérico `EntityClient`), **movimientos de almacén**
(assign/move position, código físicamente en `Stores` pero auditado aquí por ser
interacción directa con el palet), **vinculación masiva desde el pedido**
(`OrderPallets/hooks/useOrderPallets.ts`, evitando duplicar GAP-V2-025/026 de
`orders`).

Sigue fuera de alcance tras ambas pasadas: el motor genérico `EntityClient` en sí
(afecta a todos los catálogos, no solo pallets — auditoría de plataforma aparte),
el resto del módulo `Stores` no relacionado con palets, y el carril
`permissions-multitenant-auditor` (ver § 9).

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
| listado (config específica de pallets) | audited | audited | not_applicable | not_applicable | audited | not_applicable |
| listado (motor genérico `EntityClient`) | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable |
| movimientos de almacén (assign/move position) | audited | audited | audited | not_applicable | audited | audited |
| vinculación masiva desde pedido (`OrderPallets`) | audited | audited | audited | not_applicable | audited | not_applicable |
| responsive/a11y | not_applicable | not_applicable | not_applicable | not_applicable | not_applicable | audited |

Nota: `ui-audit-agent` cubre `ux-ui` y `a11y-responsive`; se ha marcado
`a11y-responsive` como `audited` solo en la fila dedicada para no duplicar filas.
`data-api` queda `not_applicable` en toda la tabla porque no se lanzó
`permissions-multitenant-auditor` en ninguna de las dos pasadas (ver § 9, flag
pendiente sobre visibilidad de campos de coste en el GET inicial).

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

**Segunda pasada (2026-07-05)** — mismos 3 carriles, sobre las 3 superficies que
quedaron fuera de alcance: listado de palets, movimientos de almacén (assign/move
position, código en `Stores`) y vinculación masiva desde el pedido
(`OrderPallets/hooks/useOrderPallets.ts`, 822 líneas). 25 GAP candidates
escritos → 23 GAPs finales tras normalizar (17 `ready`, 6 `blocked`, 2
`rejected`/absorbidos).

Hallazgo más severo de esta segunda pasada, y el más importante de toda la
auditoría del módulo hasta ahora en términos de riesgo de regresión inmediata:
**GAP-V2-083 demostró que la premisa de un GAP `ready` de la primera pasada
(GAP-V2-059, "eliminar servicio legacy muerto `palletService.js`") era
incorrecta** — ese archivo alimenta activamente `list`/`delete`/`deleteMultiple`
del listado `/admin/pallets`. Ejecutarlo tal como estaba escrito habría roto el
listado de palets en producción. `gap-normalizer` corrigió `GAP-V2-059` in-place
con el alcance real (eliminar solo los 4 métodos confirmados muertos) antes de
que `gap-implementor` pudiera tomarlo — ver § 7 para el detalle completo.

Segundo hallazgo relevante: el mismo bug de dominio P0 de la primera pasada
(código de barras GS1-128 con AI de precisión incorrecto, peso decodificado ×100
por lectores externos) **reaparece en un tercer punto de creación de cajas**
(`useOrderPallets.ts` al crear un palet desde previsión de pedido) no cubierto
por el `target_files` de GAP-V2-078 — nuevo GAP-V2-109, P0, dependiente de
GAP-V2-078. `domain-business-auditor` marca esto como candidato a regla
permanente en `project-learnings.md`: la construcción de GS1-128 debería
centralizarse para no tener que repetir el mismo fix en cada sitio (detectado en
6+ archivos de 3 módulos distintos: pallets, production, label editor).

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

### Segunda pasada (2026-07-05) — listado, movimientos de almacén, vinculación masiva

**domain-business-auditor (8, GAP-V2-103..110):**
- GS1-128 con el mismo AI de precisión incorrecto que GAP-V2-078, ahora en la
  creación de palet desde previsión de pedido. `useOrderPallets.ts:636-651`. P0,
  depende de GAP-V2-078.
- Asignar palet(s) a una posición ya ocupada no avisa ni bloquea — riesgo de dos
  palets en la misma ubicación física. `useStorePositions.ts:177-180` (guard
  existente, nunca usado antes de `assignPalletsToPosition`). P1, `blocked`
  (decisión de negocio pendiente).
- Mover un palet a otro almacén no aclara qué pasa con su posición física
  anterior — riesgo de colisión en destino. P1, `blocked` (requiere confirmación
  de backend).
- Creación desde previsión no valida cantidad positiva antes de repartir peso
  entre cajas (recurrencia de GAP-V2-080). P1, depende de GAP-V2-080.
- Mover un palet vinculado a un pedido pendiente no advierte al usuario. P2.
- Listado sin columna "Posición" pese al filtro ubicado/no ubicado (fusionado con
  GAP-V2-098 de ui-audit-agent). P2.
- Listado sin filtro de disponibilidad de stock pese a mostrarse en columnas. P2,
  `blocked` (requiere confirmar soporte del backend).
- Listado sin columna de fecha pese a filtro por rango de fechas. P2, `blocked`
  (requiere confirmar nombre de campo backend).

**ui-audit-agent (8, GAP-V2-093..100):**
- 4 componentes de movimientos de almacén usan `useIsMobile()` sin guard para
  ramificar el árbol de render (recurrencia PL-022), peor caso en
  `PositionSlideover/PalletCard/index.tsx`. P1.
- "Quitar de posición" se ejecuta sin confirmación desde 3 puntos de entrada
  distintos. P1.
- `<Loader/>` como estado de carga en 3 diálogos de movimiento/vinculación
  (recurrencia PL-023). P1.
- `OrderPalletCard` usa un SVG manual sin nombre accesible en vez del icono
  Lucide que ya usa su hermano `OrderPalletTableRow`. P1.
- `PalletsListDialog` sin estado vacío cuando la búsqueda/filtro no arroja
  resultados. P2.
- Botones de submit sin deshabilitar durante el envío en 2 diálogos de
  movimiento. P2.
- `font-semibold` fuera de la escala tipográfica (recurrencia PL-024) en
  componentes nuevos de movimientos de almacén. P3.
- Filtro "Posición" sin columna que confirme el resultado (fusionado en
  GAP-V2-104 de domain-business-auditor). P3, `rejected` (absorbido).

**code-audit-agent (9, GAP-V2-083..091):**
- **Premisa de GAP-V2-059 incorrecta** — `palletService.js` no está muerto,
  alimenta `list`/`delete`/`deleteMultiple` del listado de palets vía
  `entityServiceMapper.ts` → `EntityClient`. P0, `rejected` (absorbido —
  corrección aplicada directamente sobre GAP-V2-059, ver § 7).
- Bloques de acciones comentadas y muertas en la config del listado. P4.
- Diálogos de mover/ubicar palets llaman a `palletService` directamente y
  extraen el token en el componente, saltándose la capa de hook (inconsistente
  con `moveMultiplePalletsToStore`, que sí usa `getAuthToken()` internamente).
  P1.
- `src/hooks/useStorePositions.js` confirmado como duplicado muerto
  pre-migración de la versión `.ts`. P3.
- `useStoreDialogs.ts` mantiene el estado de posición en una copia local
  desincronizada de la query real — no usa TanStack Query. P2, `blocked`
  (tamaño L).
- Buscador de palets para vincular reimplementa fetch manual con `useState` en
  vez de `useQuery` (distinto del hallazgo ya cubierto por GAP-V2-025/026 de
  `orders`, que es sobre las mutaciones). P2.
- `OrderPallets/hooks/useOrderPallets.ts` (822 líneas) mezcla 6+ diálogos sin
  relación — candidato a split en sub-hooks. P2, `blocked` (tamaño L).
- `buildGs1128` y el reparto de peso entre cajas viven inline, no testeables en
  aislamiento. P3, depende de GAP-V2-109.
- `key={index}` duplicado idéntico en 4 archivos (2 de Orders, 2 de Stores). P4.

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

### Segunda pasada (2026-07-05) — 3 superficies nuevas: listado, movimientos de almacén, vinculación masiva

Rangos de numeración de esta pasada (contiguos a la primera):

```text
code-audit-agent          → GAP-V2-083 .. GAP-V2-091 (9)
ui-audit-agent               → GAP-V2-093 .. GAP-V2-100 (8)
domain-business-auditor         → GAP-V2-103 .. GAP-V2-110 (8)
```

`gap-normalizer` procesó **25 candidatos** en total (18 de la lista inicial + 4
notificados durante el proceso — GAP-V2-087, 088, 099, 100 — + 3 encontrados en
disco sin haber sido notificados — GAP-V2-089, 090, 091 — confirmados por el
coordinador como parte cerrada del mismo lote). Resultado: **23 GAPs finales**
(tras fusionar 2 pares, sin divisiones) → **17 ready · 6 blocked · 0 later · 2
rejected (absorbidos)**.

**Caso especial — corrección de GAP-V2-059 (primera pasada):** GAP-V2-083
demostró con evidencia file:line que `src/services/domain/pallets/palletService.js`
**no está muerto** — alimenta `list`/`delete`/`deleteMultiple` del listado de
palets vía `entityServiceMapper.ts:60,104` → `EntityClient/index.js:285,417,589`,
contradiciendo la premisa original de GAP-V2-059 ("archivo completamente
muerto"). Verificado de forma independiente por `gap-normalizer` (grep sobre
`entitiesConfig.stock.ts` y `EntityClient/index.js`, confirmando `hideEditButton`,
`createRedirect`, `viewRoute` para la entidad `pallets`, y que `getById`/`create`/
`update`/`getOptions` sí están muertos). Acción tomada: **GAP-V2-059 fue
reescrito con el alcance corregido** (eliminar solo los 4 métodos muertos —
`getById`/`create`/`update`/`getOptions` —, mantener `list`/`delete`/
`deleteMultiple`), status `ready`, categoría `code-quality`, prioridad P2 (subida
desde P3 por el riesgo de regresión que motivó la corrección). **GAP-V2-083
reescrito como `rejected` (absorbido)** — su contenido y evidencia se conservan en
su propio archivo para trazabilidad, pero no debe ejecutarse por separado: la
solución vive íntegramente en GAP-V2-059. Esto evita que `gap-implementor`
ejecute la solución original de GAP-V2-059 (borrar el archivo completo), que
habría roto `/admin/pallets` en producción.

**Fusión — filtro de posición sin columna:** GAP-V2-098 (ui-audit-agent, ux-ui,
"filtro sin columna que confirme resultado") y GAP-V2-104 (domain-business-auditor,
domain-business, "no muestra posición física pese a filtro ubicado/no ubicado")
eran el mismo hallazgo visto desde dos ángulos — mismo archivo
(`entitiesConfig.stock.ts`), misma solución (añadir header `position` a
`table.headers`). Fusionados en **GAP-V2-104** (`ready`, `domain-business`, P2,
conserva el matiz UX de "resultado del filtro verificable en la tabla" en sus
criterios de aceptación). **GAP-V2-098 reescrito como `rejected` (absorbido)**.

**Decisión — GAP-V2-103 vs. GAP-V2-104/098 (columnas del listado):** se
mantienen como GAPs **independientes** en vez de agruparlos bajo una única
historia de "columnas del listado de palets": son dos columnas distintas
(fecha vs. posición), verificables por separado, y GAP-V2-103 además queda
`blocked` por un dato pendiente de confirmar (nombre exacto del campo backend de
fecha) mientras GAP-V2-104 no depende de ninguna confirmación externa (el campo
`position` ya se usa y confirma en `AddElementToPositionDialog`). Se documenta la
relación (misma superficie, mismo archivo `table.headers`) en el campo Links de
ambos, sin fusionar.

**Decisión — GAP-V2-100 vs. GAP-V2-073 (ya `ready`, primera pasada):** mismo
síntoma (`font-semibold` fuera de escala, PL-024) en archivos nuevos de la
superficie de movimientos de almacén. Se decidió **mantener GAP-V2-100 como GAP
independiente** en vez de ampliar `target_files` de GAP-V2-073, para no cambiar
retroactivamente el alcance de un GAP ya aprobado y `ready`, y para preservar la
trazabilidad por superficie/pasada. GAP-V2-073 no se modifica.

**Deduplicación de criterios (sin fusión de GAP, solo de contenido) — isSubmitting
en diálogos de movimiento:** GAP-V2-085 (code-audit-agent, arquitectura: diálogos
de mover/ubicar palets llaman al service directamente) y GAP-V2-099
(ui-audit-agent, UX: botones de submit sin `isSubmitting`) compartían literalmente
el mismo criterio de aceptación sobre los mismos 2 componentes
(`MovePalletToStoreDialog`, `AddElementToPositionDialog`). Se retiró el criterio
de `isSubmitting` de GAP-V2-085, que queda acotado a la capa de llamada
(service-en-componente + token-as-parameter); GAP-V2-099 conserva el criterio
completo. Ambos GAPs quedan `ready` e independientes entre sí (sin dependencia
dura), con nota cruzada sobre el orden de implementación recomendado.

**GAPs `blocked` (6) — requieren confirmación de Jose o del backend:**
- GAP-V2-087 (L, arquitectura: estado de posición no sincroniza con TanStack
  Query) — bloqueado únicamente por tamaño (regla dura L/XL sin autorización de
  Jose), no por falta de información. Depende de GAP-V2-085.
- GAP-V2-089 (L, arquitectura: split de `useOrderPallets.ts` de 822 líneas) —
  mismo motivo (tamaño L). Depende de GAP-V2-088.
- GAP-V2-103 (domain-business: falta columna de fecha) — falta confirmar el
  nombre exacto del campo backend de fecha de creación.
- GAP-V2-105 (domain-business: falta filtro de disponibilidad de stock) —
  requiere confirmar si el backend soporta el filtro o necesita cambio de API.
- GAP-V2-106 (domain-business: asignar a posición ya ocupada sin aviso) —
  decisión de negocio pendiente: ¿una posición aloja uno o varios palets?
- GAP-V2-107 (domain-business: traspaso de almacén no gestiona posición
  anterior) — requiere confirmar si el backend limpia `position` al traspasar.

**Dependencias nuevas entre GAPs de esta pasada (todas con el GAP del que dependen
ya `ready`, cadena ejecutable sin bloqueo real):**
- GAP-V2-109 (P0, GS1-128 en `useOrderPallets`) depende de GAP-V2-078 (P0, mismo
  bug, primera pasada, ya `ready`).
- GAP-V2-110 (validación de peso positivo en creación desde previsión) depende de
  GAP-V2-080 (mismo criterio, primera pasada, ya `ready`).
- GAP-V2-090 (extraer `buildGs1128`/reparto de peso a util testeable) depende de
  GAP-V2-109 — corregir el bug de AI antes de extraer la función pura.
- GAP-V2-087 depende de GAP-V2-085; GAP-V2-089 depende de GAP-V2-088 (ver
  arriba).

**Ready (17):** GAP-V2-084, 085, 086, 088, 090, 091, 093, 094, 095, 096, 097, 099,
100, 104, 108, 109, 110.

**Rejected (2):** GAP-V2-083 (absorbido en GAP-V2-059, corrección de premisa —
ver arriba), GAP-V2-098 (absorbido en GAP-V2-104, fusión de duplicado).

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
- 2026-07-05 — `gap-normalizer` procesa la segunda pasada (25 candidatos, 3
  superficies: listado de palets, movimientos de almacén, vinculación masiva
  desde pedido). Decisiones tomadas por `gap-normalizer` (no requieren
  respuesta de Jose salvo donde se indica):
  1. **GAP-V2-059 (primera pasada) corregido, no eliminado.** GAP-V2-083
     demostró con evidencia file:line (`entityServiceMapper.ts:60,104` →
     `EntityClient/index.js:285,417,589`) que
     `src/services/domain/pallets/palletService.js` **no está muerto**: sirve
     `list`/`delete`/`deleteMultiple` para `/admin/pallets`. La solución
     original de GAP-V2-059 ("eliminar el archivo completo") habría roto el
     listado de palets en producción. `gap-normalizer` verificó la evidencia de
     forma independiente (grep sobre `entitiesConfig.stock.ts` confirmando
     `hideEditButton`/`createRedirect`/`viewRoute`, y sobre `EntityClient/index.js`
     confirmando que solo se llama a `list`/`delete`/`deleteMultiple` para
     `pallets`) y **reescribió GAP-V2-059 con el alcance corregido**: eliminar
     solo los 4 métodos confirmados muertos (`getById`/`create`/`update`/
     `getOptions`), mantener los 3 activos. GAP-V2-059 sigue `ready`, ahora con
     el fix correcto. **GAP-V2-083 queda `rejected` (absorbido)** — su
     evidencia se conserva en su propio archivo, pero no se ejecuta por
     separado. Esto es prioritario: cualquier ejecución de `/implement-next`
     sobre GAP-V2-059 debe tomar el contenido ya corregido del archivo, no una
     versión en caché de la solución original.
  2. **GAP-V2-098 (ui-audit-agent) fusionado en GAP-V2-104 (domain-business-auditor).**
     Mismo hallazgo (falta columna "Posición" en el listado de palets pese al
     filtro Ubicado/No ubicado), dos ángulos. GAP-V2-104 conserva el matiz UX
     de GAP-V2-098 en sus criterios de aceptación; GAP-V2-098 queda `rejected`
     (absorbido).
  3. **GAP-V2-103 y GAP-V2-104 se mantienen independientes** (no se agrupan en
     una única historia de "columnas del listado") — son columnas distintas
     (fecha vs. posición) verificables por separado, y tienen bloqueos
     distintos (GAP-V2-103 necesita confirmar un nombre de campo backend,
     GAP-V2-104 no depende de ninguna confirmación externa).
  4. **GAP-V2-100 se mantiene independiente de GAP-V2-073** (ya `ready` de la
     primera pasada) — mismo síntoma (`font-semibold` fuera de escala) en
     archivos nuevos de la superficie de movimientos de almacén, pero no se
     amplía el `target_files` de un GAP ya aprobado retroactivamente.
  5. **Pendiente de Jose — 6 GAPs `blocked` de esta pasada:**
     - GAP-V2-087 y GAP-V2-089 (ambos tamaño L): autorización explícita de
       Jose para marcarlos `ready`, mismo protocolo que GAP-V2-058/062 en la
       primera pasada.
     - GAP-V2-103: confirmar el nombre exacto del campo backend de fecha de
       creación/entrada del palet.
     - GAP-V2-105: confirmar si el backend soporta filtrar por disponibilidad
       de stock o si requiere cambio de API.
     - GAP-V2-106: decisión de negocio — ¿una posición de almacén aloja
       legítimamente uno o varios palets a la vez?
     - GAP-V2-107: confirmar si el endpoint de traspaso de almacén
       (`pallets/move-to-store`) limpia el campo `position` del palet.
- 2026-07-06 — Jose resuelve 5 de los 6 `blocked` de la pasada 2 (queda 1
  pendiente de investigación técnica, no de decisión de negocio):
  1. **GAP-V2-087 y GAP-V2-089 (ambos L):** autorizados, mismo protocolo que
     GAP-V2-058/062/065 — PR aislado cada uno, respetando dependencias
     (GAP-V2-085 → 087; GAP-V2-088 → 089). Pasan a `ready`.
  2. **GAP-V2-106 (posición ya ocupada):** una posición de almacén **puede
     alojar legítimamente varios palets a la vez** — no es un hueco de un solo
     palet. Se descarta el bloqueo/confirmación; el GAP se re-scopea a mostrar
     información de ocupación en el diálogo de asignación antes de confirmar
     (sin impedir la acción). Categoría se mantiene `domain-business`,
     prioridad P1→P2, tamaño M→S. Pasa a `ready`.
  3. **GAP-V2-107 (traspaso de almacén y posición anterior):** confirmado que
     el backend limpia el campo `position` al traspasar — sin riesgo real de
     colisión. Se descarta cualquier cambio de payload/lógica; el GAP se
     re-scopea a solo añadir copy informativo en los diálogos de traspaso
     indicando que el palet queda sin ubicar en destino. Categoría
     domain-business→ux-ui, prioridad P1→P3, tamaño S→XS. Pasa a `ready`.
  4. **GAP-V2-103 (columna de fecha):** Jose no conoce el nombre exacto del
     campo backend — pide que se verifique en el momento de implementar. Pasa
     a `ready` con un criterio de aceptación explícito: confirmar el campo
     contra la respuesta real de `GET /api/v2/pallets` antes de escribir el
     header (no asumir `created_at` sin comprobar).
  5. **GAP-V2-105 (filtro de disponibilidad de stock):** Jose tampoco lo sabe
     de memoria y pide investigar/probar contra el backend. A diferencia de
     GAP-V2-103, aquí no está garantizado que el backend soporte el filtro —
     **queda `blocked`**: quien lo retome debe verificar primero contra la API
     real: si hay soporte del lado servidor, pasa a `ready`; si no, se
     convierte en petición de cambio de backend, fuera del alcance de este
     módulo frontend.

Registry regenerado tras estas decisiones (2026-07-06): **42 ready, 1 blocked
(GAP-V2-105), 0 done, 0 later, 5 rejected** — total del módulo, ambas pasadas.

## 11. Cambios desde la última auditoría

**Pasada 2 (2026-07-05) vs. Pasada 1 (2026-07-05, mismo día):** se amplió la
cobertura del módulo a las 3 superficies que la pasada 1 dejó explícitamente
fuera de alcance (listado de palets, movimientos de almacén, vinculación masiva
desde pedido). No hubo reauditoría de lo ya cubierto en pasada 1 — solo
superficies nuevas. Cambio más relevante: se detectó y corrigió una premisa
incorrecta en un GAP ya `ready` de la pasada 1 (GAP-V2-059) antes de que llegara
a implementarse — ver § 7 y § 10 para el detalle. También se identificó una
recurrencia del bug P0 de GS1-128 de la pasada 1 (GAP-V2-078) en un archivo
nuevo, ahora GAP-V2-109.

## 12. Instrucciones para retomar en otro chat/modelo

Dos pasadas completadas sobre `pallets` (ambas 2026-07-05):

- **Pasada 1:** pantalla de creación/edición de palet (desktop + mobile) — ver
  § 5 para alcance detallado.
- **Pasada 2:** listado de palets (solo config específica de pallets, no el
  motor genérico `EntityClient`), movimientos de almacén (assign/move position,
  código en `Stores`), vinculación masiva desde pedido
  (`OrderPallets/hooks/useOrderPallets.ts`).

**Sigue sin auditar** — no asumir cobertura:
- El motor genérico `EntityClient`/`EntityTable`/`EntityForms` en sí (afecta a
  todos los catálogos, no es específico de pallets — auditoría de plataforma
  aparte si se prioriza).
- El resto del módulo `Stores` no relacionado con la interacción con palets
  (creación/edición de almacenes y posiciones en sí, mapa de almacén, etc.).
- El carril `permissions-multitenant-auditor` (visibilidad de campos de coste,
  aislamiento de tenant en movimientos entre almacenes) — no lanzado en ninguna
  de las dos pasadas.
- El carril `design-quality-auditor` — no lanzado en ninguna de las dos
  pasadas.

Antes de tomar `GAP-V2-059` para implementar: leer su versión actual completa,
no una versión en caché — fue reescrito en la pasada 2 tras descubrirse que su
alcance original habría roto producción (ver § 7).

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
