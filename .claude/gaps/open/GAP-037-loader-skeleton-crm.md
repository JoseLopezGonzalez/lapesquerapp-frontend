# GAP-037 — Loader → Skeleton en módulo CRM

## Metadata

- **Tipo:** Refactor
- **Módulo:** CRM
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Cuatro componentes del módulo CRM usan `<Loader>` como estado de carga primario de datos. El número de instancias en `ProspectDetail.jsx` (×4) indica que este componente tiene varios estados de carga independientes que todos muestran el mismo spinner incorrecto.

**Archivos afectados:**

| Archivo | Líneas | Contexto |
|---|---|---|
| `ProspectsPageClient.jsx` | 41, 356 | Carga de lista de prospectos |
| `ProspectDetail.jsx` | 285, 686, 791, 886 | Carga de datos de prospecto (×4 secciones) |
| `OffersPageClient.jsx` | 166 | Carga de lista de ofertas |
| `AgendaPageClient.jsx` | 1197 | Carga del calendario mensual |
| `AgendaPageClient.jsx` | 882 | Carga de acciones del día en `AgendaDayDialog` |

---

## Solución acordada

Reemplazar cada `<Loader>` por `<Skeleton>` apropiado según el contenido que reemplaza:

- **ProspectsPageClient**: Skeleton de lista de tarjetas de prospectos
- **ProspectDetail** (×4): Skeleton de detalle — header con nombre/estado + secciones de datos
- **OffersPageClient**: Skeleton de tabla de ofertas
- **AgendaPageClient** (calendario): Skeleton de cuadrícula de 5×5 celdas (grid mensual)
- **AgendaPageClient** (day dialog): Skeleton de lista de acciones del día dentro del ScrollArea

## UI Brief

- **Vista de referencia:** `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js` — patrón Skeleton canónico; `AgendaMonthCalendar` como referencia de cuadrícula
- **Tipo de layout:** Skeleton contextual según el contenido (lista, tabla, cuadrícula, detalle)
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton) / loaded (contenido real)
- **Mobile:** aplica en ProspectsPageClient y ProspectDetail (se usan en comercial mobile-first)

---

## Criterios de aceptación

- [ ] `ProspectsPageClient.jsx` no renderiza `<Loader>` en ninguna condición de carga de datos
- [ ] `ProspectDetail.jsx` no renderiza `<Loader>` en ninguna de sus 4 secciones de carga
- [ ] `OffersPageClient.jsx` no renderiza `<Loader>` en ninguna condición de carga de datos
- [ ] `AgendaPageClient.jsx` no renderiza `<Loader>` ni para el calendario ni para el dialog de día
- [ ] El Skeleton del calendario reproduce la cuadrícula mensual (7 columnas × N filas de celdas)
- [ ] El Skeleton del dialog de día reproduce la lista de tarjetas de acciones
- [ ] Los imports de `<Loader>` se eliminan de los archivos que dejan de usarlo
- [ ] El comportamiento funcional (filtros, acciones, mutaciones) no cambia

## Archivos a crear o modificar

- `src/components/Comercial/CRM/ProspectsPageClient.jsx`
- `src/components/Comercial/CRM/ProspectDetail.jsx`
- `src/components/Comercial/CRM/OffersPageClient.jsx`
- `src/components/Comercial/CRM/AgendaPageClient.jsx`

## Restricciones

- No modificar la lógica de negocio ni los handlers de ningún componente
- No cambiar las props ni la interfaz de ningún componente
- No tocar hooks ni services del módulo CRM
- Este GAP NO aborda el `useIsMobile()` en ProspectsPageClient y OffersPageClient (ver GAP-042)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
