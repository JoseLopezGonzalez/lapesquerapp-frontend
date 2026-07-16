# GAP-116 — Fidelidad 100% de skeletons en todo el Editor de Pedido (auditoría + implementación)

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas (Editor de Pedido — `Order/*`)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-16
- **Autor:** Jose

---

## Contexto y problema

Investigación previa a este GAP detectó que el Editor de Pedido tiene **dos capas de
skeleton** distintas, y la mayoría de sus 12 pestañas cargadas de forma perezosa
(`lazy: true` en `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts`)
carecen de fidelidad en una o ambas capas:

**Capa 1 — Fallback de Suspense (code-splitting):**
Las 12 pestañas lazy comparten un único fallback genérico:

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx:133` →
  `<Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx:10-30`
  (`getFallback`) → mismo rectángulo genérico (`h-64` o `h-24` para `customer-history`),
  sin ninguna estructura interna.

Esto se ve brevemente la primera vez que se visita cada pestaña (mientras se descarga el
chunk JS), pero es idéntico para las 12 pestañas sin importar lo distinta que sea su UI real.

**Capa 2 — Skeleton de carga de datos propio de cada pestaña:**
De las 12 pestañas lazy, solo 3 tienen algún skeleton propio hoy:

| Pestaña (id)       | Componente                    | Skeleton propio                                                                                          |
| ------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `analysis`         | `OrderCostAnalysis/index.jsx` | ✅ Auditado y corregido en GAP-114 (fidelidad confirmada)                                                |
| `attachments`      | `OrderAttachments/index.tsx`  | ⚠️ Existe, fidelidad no auditada aún                                                                     |
| `pallets`          | `OrderPallets/*`              | ⚠️ Solo existe dentro de `dialogs/LinkPalletsDialog.tsx` — la pestaña principal no tiene skeleton propio |
| `products`         | `OrderPlannedProductDetails`  | ❌ Ninguno                                                                                               |
| `productDetails`   | `OrderProductDetails`         | ❌ Ninguno                                                                                               |
| `auxiliary`        | `OrderAuxiliaryLines`         | ❌ Ninguno                                                                                               |
| `production`       | `OrderProduction`             | ❌ Ninguno                                                                                               |
| `labels`           | `OrderLabels`                 | ❌ Ninguno                                                                                               |
| `documents`        | `OrderDocuments`              | ❌ Ninguno                                                                                               |
| `export`           | `OrderExport`                 | ❌ Ninguno                                                                                               |
| `map`              | `OrderMap`                    | ❌ Ninguno                                                                                               |
| `incident`         | `OrderIncident`               | ❌ Ninguno                                                                                               |
| `customer-history` | `OrderCustomerHistory`        | ❌ Ninguno                                                                                               |

(`details`/`OrderDetails` no es lazy — se renderiza junto con el resto del editor y no
entra en el alcance de este GAP salvo que la auditoría detecte algo puntual.)

Este patrón de "skeleton sin rama `isMobile`" o "skeleton ausente" ya está documentado
como recurrente en **PL-027** (`.claude/project-learnings.md`), que cubrió 4 casos
(GAP-111 a GAP-114) del módulo Orders Manager en general. Este GAP es la continuación
natural de esa misma línea de trabajo, pero centrada específicamente en las pestañas del
Editor de Pedido que quedaron fuera de esa primera pasada — 9 de ellas sin ningún
skeleton propio y las 12 sin fidelidad en el fallback de Suspense.

## Objetivo

Que las 12 pestañas del Editor de Pedido tengan skeletons fieles al 100% al componente
real que sustituyen, en ambas capas (Suspense fallback y carga de datos propia), tanto en
mobile como en desktop, siguiendo el mismo nivel de detalle y proceso que GAP-111 a
GAP-114.

## Solución acordada

Jose decidió explícitamente que **este GAP no se implementa directamente** escribiendo
skeletons a mano para las 12 pestañas de golpe. En su lugar:

1. Ejecutar `/audit-skeletons` (mobile y desktop — `both`) acotado al Editor de Pedido
   (`src/components/Admin/OrdersManager/Order/`), cubriendo explícitamente **ambas
   capas**: el fallback de Suspense (`OrderTabsDesktop.tsx`, `OrderSectionContentMobile.tsx`)
   y el skeleton de datos propio de cada una de las 12 pestañas listadas arriba.
2. El `skeleton-fidelity-auditor` genera **un GAP detallado por pestaña** (o por hallazgo,
   si una pestaña tiene varios problemas independientes en las dos capas), con el mismo
   formato que GAP-111 a GAP-114: sección `## Skeleton Reference` con componente real
   (archivo:línea), componente skeleton (archivo:línea), viewport afectado, y criterios de
   aceptación verificables línea a línea.
3. Cada GAP resultante se implementa con `skeleton-implementor` y se audita
   individualmente, igual que el resto de la serie PL-027.
4. Este GAP-116 queda como **GAP paraguas / de seguimiento**: se cierra cuando todas las
   pestañas de la tabla anterior tengan su GAP hijo correspondiente cerrado y aprobado.

## Referencias e inspiración

- PL-027 (`.claude/project-learnings.md:109-127`) — patrón recurrente de skeletons sin
  rama `isMobile` en Orders Manager; precedente directo de este GAP.
- GAP-111, GAP-112, GAP-113, GAP-114 (closed) — formato y rigor esperado para cada GAP hijo.
- `src/components/Admin/OrdersManager/Order/config/sectionsConfig.ts` — listado
  autoritativo de las 12 pestañas lazy y sus componentes.

## Criterios de aceptación

- [ ] Se ha ejecutado `/audit-skeletons` (mobile + desktop) acotado al Editor de Pedido,
      cubriendo explícitamente el fallback de Suspense y el skeleton de datos de cada una
      de las 12 pestañas de la tabla de contexto.
- [ ] Existe un GAP hijo (con `## Skeleton Reference`) por cada hallazgo detectado, como
      mínimo uno por cada pestaña marcada ❌ o ⚠️ en la tabla de contexto (9 pestañas sin
      skeleton propio + `attachments` + `pallets`), más el fallback de Suspense compartido.
- [ ] Todos los GAP hijos quedan implementados (`skeleton-implementor`) y auditados
      (✅ APROBADO o ⚠️ APROBADO CON OBSERVACIONES) antes de cerrar este GAP-116.
- [ ] Ninguna de las 12 pestañas lazy del Editor de Pedido muestra ya el rectángulo
      genérico `h-64`/`h-24` sin estructura interna, ni en el fallback de Suspense ni en su
      carga de datos propia.
- [ ] Los skeletons corregidos ramifican por `isMobile` quando el componente real lo hace,
      siguiendo la regla de PL-027.

## Plan de validación

```text
/audit-skeletons desktop  (o both)  — acotado a src/components/Admin/OrdersManager/Order/
# Tras generarse los GAPs hijos, para cada uno:
npm run lint
npm run type-check
# Verificación manual: visitar cada pestaña del editor en mobile y desktop simulando
# carga lenta (throttling) para comparar skeleton vs componente real.
```

## Archivos a crear o modificar

No aplica directamente a este GAP (es un GAP de seguimiento/orquestación). Los archivos
reales se determinan y listan en cada GAP hijo generado por la auditoría. Componentes
candidatos ya identificados como referencia para la auditoría:

- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx`
- `src/components/Admin/OrdersManager/Order/components/OrderSectionContentMobile.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/`
- `src/components/Admin/OrdersManager/Order/OrderProduction/`
- `src/components/Admin/OrdersManager/Order/OrderPallets/`
- `src/components/Admin/OrdersManager/Order/OrderLabels/`
- `src/components/Admin/OrdersManager/Order/OrderDocuments/`
- `src/components/Admin/OrdersManager/Order/OrderExport/`
- `src/components/Admin/OrdersManager/Order/OrderMap/`
- `src/components/Admin/OrdersManager/Order/OrderIncident/`
- `src/components/Admin/OrdersManager/Order/OrderCustomerHistory/`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx` (fidelidad a confirmar)

## Restricciones

- No implementar skeletons "a ojo" sin pasar por la auditoría — el objetivo explícito de
  Jose es fidelidad 100%, y eso requiere el mismo proceso línea a línea que GAP-111 a
  GAP-114, no una aproximación genérica.
- No tocar la lógica de negocio ni las queries de ninguna pestaña — solo sus estados de
  carga (Suspense fallback y skeleton de datos).
- No cerrar este GAP-116 hasta que todos los GAP hijos estén cerrados y aprobados.
- Mantener el mismo formato de `## Skeleton Reference` usado en GAP-111 a GAP-114 en cada
  GAP hijo, para conservar trazabilidad con PL-027.

---

## UI Brief

- **Vista de referencia:** GAP-114 (`OrderCostAnalysis`) como ejemplo ya aprobado del
  nivel de fidelidad esperado (grid responsive idéntico + sub-bloques con jerarquía real,
  no un rectángulo plano).
- **Tipo de layout:** no aplica a este GAP paraguas — cada GAP hijo hereda el layout real
  de su pestaña (tabla, grid de cards, formulario, mapa, etc.).
- **Componentes clave:** `Skeleton` (shadcn) en todos los casos; estructura interna
  (`Card`/`CardHeader`/`CardContent`, filas de tabla, grids) específica de cada pestaña,
  a determinar en cada GAP hijo.
- **Estados requeridos:** loading (Suspense) y loading (datos) — ambas capas fieles al
  componente real en su estado `success`.
- **Mobile:** aplica ahora — la mayoría de las pestañas ramifican layout por `isMobile`
  (ver PL-027) y el skeleton debe replicar esa ramificación, no solo el desktop.

### Preguntas de confirmación para Jose

Ya resueltas durante el discovery:

1. Enfoque → **Ejecutar primero la auditoría** (`/audit-skeletons`), que generará un GAP
   detallado por pestaña; este GAP-116 documenta y rastrea esa decisión en vez de
   implementar los 12 skeletons a mano.
2. Alcance de capas → **Ambas**: el fallback de Suspense y el skeleton de datos propio de
   cada pestaña.

---

## Implementación

> Rellena el Agente Implementador (en este caso: el orquestador que lanza
> `/audit-skeletons` y da seguimiento a los GAP hijos resultantes)

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Este GAP-116 se aprueba cuando todos los GAP hijos generados por la auditoría están
> cerrados y aprobados — no requiere un veredicto técnico/visual propio, sino la
> verificación de que la lista de pestañas de la tabla de contexto queda completa.

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos (todos los GAP hijos cerrados y aprobados)
- [ ] Patrones de `.claude/rules/` respetados en cada GAP hijo
- [ ] PL-027 actualizado si la auditoría revela un sub-patrón nuevo no cubierto

### Observaciones para Jose

### Estado final de la implementación
