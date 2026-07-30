# GAP-130 — Nº de Booking y países origen/destino en datos de envío marítimo

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose
- **Depende de:** GAP-126 (ya cerrado — mismo formulario `MaritimeShippingDetailForm.tsx`)

---

## Contexto y problema

Refinamiento v2 del backend sobre `OrderMaritimeShippingDetail` (GAP-124/126, ya implementado):
3 campos nuevos, todos texto libre, todos opcionales, mismo recurso 1:1 y mismo `PUT` de
reemplazo completo (sin endpoint nuevo):

- `bookingNumber: string | null` — Nº de reserva de espacio con la naviera.
- `originCountry: string | null` — override opcional del país de origen (si vacío, el PDF sigue
  usando el país de la empresa como hoy).
- `destinationCountry: string | null` — override opcional del país de destino (si vacío, el PDF
  sigue usando el país del cliente como hoy).

Los 3 son texto libre, no catálogo (mismo criterio ya usado para `loadingPort`/`dischargePort`) —
un `<Input>` simple es suficiente, sin Combobox ni selector de países.

El resto de la guía v2 (confirmación de que `hsCode` ya funcionaba, y refino puramente visual del
PDF — tarjetas de metadatos agrupadas, fondo de las tarjetas Shipper/Consignee corregido, HTSUS
agregado por especie) **no requiere ningún cambio de frontend** — son cambios de presentación del
PDF en backend, sin impacto en API ni en el formulario.

## Solución acordada

### 1. Tipos (`src/types/orders.ts`)

Ampliar `MaritimeShippingDetail` y `MaritimeShippingDetailPayload` con los 3 campos
(`string | null`, opcionales en el payload).

### 2. Schema (`schemas/maritimeShippingDetailSchema.ts`)

Añadir `bookingNumber`, `originCountry`, `destinationCountry`:
`z.string().max(100, 'Máximo 100 caracteres').nullable().optional()` — mismo límite ya usado
para `voyageNumber`/`swbNumber` (campos cortos de una línea).

### 3. `MaritimeShippingDetailForm.tsx`

- Añadir los 3 campos al array `FIELDS` existente (inputs de texto simples, mismo patrón que los
  6 ya presentes — no son overrides con placeholder especial como `ultimateConsigneeName`, son
  campos de documentación de envío igual que `vesselName`/`swbNumber`):
  - `bookingNumber` — label "Nº de Booking", insertado tras `exportInvoiceNumber` (agrupación
    lógica con factura/buque/viaje, igual que en las "Shipment References" del PDF).
  - `originCountry` — label "País de origen", insertado tras `dischargePort`.
  - `destinationCountry` — label "País de destino", insertado justo después de `originCountry`.
- `EMPTY_VALUES`, el `reset()` del `useEffect` de sincronización, y el payload de `onSubmit`
  (con `|| null`) se extienden a los 3 campos nuevos, siguiendo el mismo patrón ya usado para
  todos los campos existentes.
- **Fix de acompañamiento (PL-035):** el grid principal de `FIELDS` (`grid grid-cols-2 gap-3`,
  línea 145) pasa a `grid grid-cols-1 gap-3 sm:grid-cols-2`, igual que ya se hizo en GAP-126 para
  el bloque de consignatario. Se justifica tocarlo ahora porque el array crece de 6 a 9 campos
  (más superficie de riesgo en mobile) y es el mismo archivo/mismo grid ya señalado como
  IDEA-012 en el parking lot — se resuelve aquí en vez de esperar una iteración aparte, evitando
  añadir más campos a un grid ya conocido como no-responsive. Si se aplica este fix, IDEA-012
  queda resuelta (marcar en el parking lot al cerrar este GAP).

---

## UI Brief

- **Vista de referencia:** el propio `MaritimeShippingDetailForm.tsx` — extensión in-place del
  array `FIELDS` ya existente, sin componentes nuevos.
- **Tipo de layout:** inline dentro de la Card "Datos de envío" ya existente, mismo grid que los
  6 campos actuales (ahora responsive, ver fix de acompañamiento).
- **Componentes clave:** `Input`, `Label` — ninguno nuevo.
- **Estados requeridos:** los ya existentes del formulario (loading Skeleton, error con
  "Reintentar", guard anti-pisado de borrador `isDirty`) — sin estados nuevos, son 3 inputs más
  en el mismo `.map()`.
- **Mobile:** cubierto por el fix de acompañamiento (grid responsive).

### Confirmaciones ya cerradas (2026-07-30)

Ninguna pregunta abierta — la guía especifica explícitamente que los 3 campos son texto libre sin
selector, y el patrón de extensión (mismo array `FIELDS`, mismo payload) no tiene ambigüedad.

---

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`
  — archivo a extender.
- GAP-126 (cerrado) — mismo patrón exacto de extensión de este formulario, incluido el fix de
  grid responsive ya aplicado una vez al bloque de consignatario.
- `.claude/ideas/parking-lot.md` IDEA-012 — grid sin variante mobile en este mismo formulario,
  resuelto como efecto colateral de este GAP.

## Criterios de aceptación

- [ ] El formulario de datos de envío muestra 3 campos nuevos: "Nº de Booking", "País de origen",
      "País de destino", todos opcionales, tipo texto simple.
- [ ] Guardar persiste los 3 campos; recargar la pestaña los muestra ya rellenados.
- [ ] Guardar sin tocar estos 3 campos nuevos no rompe el guardado de los 6+3 campos ya
      existentes (regresión de GAP-124/126).
- [ ] El grid principal de campos se adapta a una columna en mobile (`sm:grid-cols-2`).
- [ ] `readOnly` deshabilita los 3 campos nuevos igual que el resto.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Funciona en mobile y desktop.

## Archivos a crear o modificar

**Modificar:**
- `src/types/orders.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`
- `.claude/ideas/parking-lot.md` (marcar IDEA-012 como resuelta si el fix de grid se aplica aquí)

## Restricciones

- No implementar selector de países (Combobox/Select) — texto libre, según la guía.
- No tocar el bloque de consignatario/agente de aduanas (GAP-126) salvo el cambio de clase del
  grid padre compartido.
- No tocar el catálogo de productos (`hsCode` ya estaba cubierto, sin cambios).
- No tocar nada relacionado con el PDF — los cambios visuales del PDF son 100% backend.
- No crear archivos `.js` nuevos.

---

## Implementación

### Archivos modificados

- `src/types/orders.ts` — `MaritimeShippingDetail`/`MaritimeShippingDetailPayload` amplían con
  `bookingNumber`, `originCountry`, `destinationCountry`.
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
  — 3 campos nuevos, `z.string().max(100).nullable().optional()` (mismo límite que
  `voyageNumber`/`swbNumber`).
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx` —
  3 entradas nuevas en `FIELDS` (`bookingNumber` tras `exportInvoiceNumber`;
  `originCountry`/`destinationCountry` tras `dischargePort`), `EMPTY_VALUES`/`reset()`/payload de
  `onSubmit` extendidos a los 12 campos totales. Fix de acompañamiento: grid principal
  (`grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2`) y skeleton de carga
  (`Array.from({length: 6})` → `Array.from({length: FIELDS.length})`, mismo grid responsive)
  para no dejar crecer un grid ya señalado como no-responsive (IDEA-012) al pasar de 6 a 9 campos.
- `.claude/ideas/parking-lot.md` — IDEA-012 movida a "Promoted" con nota de resolución en
  GAP-130. IDEA-011 (skeleton sin bloque de consignatario) queda intacta — fuera de alcance de
  este GAP, es un problema distinto (estructura del skeleton, no responsividad del grid).

### Decisiones tomadas durante la implementación

- `bookingNumber` se insertó tras `exportInvoiceNumber` en `FIELDS` (agrupación lógica con
  factura/buque/viaje, igual que la tarjeta "Shipment References" del PDF descrita en la guía),
  no al final del array.
- `originCountry`/`destinationCountry` se insertaron tras `dischargePort` (agrupación con los
  puertos, ambos datos de "trade"/geografía del envío).
- El límite de longitud elegido (100 caracteres) sigue el precedente de `voyageNumber`/
  `swbNumber` — campos cortos de una línea, no el de 255 usado en `vesselName`/`loadingPort`/
  `dischargePort` (inconsistencia ya preexistente en el archivo, no introducida por este GAP).
- Se actualizó el skeleton de carga para reflejar el número real de campos (`FIELDS.length` en
  vez de un literal `6` desactualizado) y se le aplicó el mismo grid responsive que al formulario
  real — evita que el estado de carga muestre una forma distinta a la del contenido final ahora
  que hay 9 campos en vez de 6.

### Desviaciones del plan

Ninguna — coincide con la Solución acordada, incluida la resolución de IDEA-012 ya prevista en el
propio GAP como parte del "fix de acompañamiento".

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, sin warnings nuevos en los 3 archivos de código tocados.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — extensión mínima y fiel al patrón de GAP-126, los 4 puntos de sincronización
(`FIELDS`, `EMPTY_VALUES`, `reset()`, payload de `onSubmit`) cubren los 3 campos nuevos sin
omisiones, el guard anti-pisado de borrador y la rama de error de carga quedan intactos, y el fix
de grid responsive se aplicó correctamente tanto al grid real como al skeleton (con conteo dinámico
`FIELDS.length`, no un literal desactualizado). `type-check`/`lint` limpios verificados de forma
independiente.

### Checklist

- [x] Criterios de aceptación cumplidos (7/7, ver detalle abajo)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] `useLabelEditor.ts` sin lógica nueva; `useOrder`/`usePallet`/`useOrderMaritimeShippingDetail.ts`
      no tocados (confirmado por `git status` — solo los 3 archivos de código + parking-lot.md)
- [x] `entitiesConfig.js`/`entitiesConfig.admin.ts` no tocados (fuera del alcance de este GAP)
- [x] Patrones de `.claude/rules/` respetados (mismo patrón `register`/`FIELDS.map`, sin componentes
      ni lógica nueva)
- [x] Nomenclatura correcta (camelCase en los 3 campos nuevos, consistente con el resto del recurso)
- [x] `queryKeys` sin tocar — no aplica, este GAP no toca hooks de query
- [x] Loading states con Skeleton — skeleton actualizado con conteo dinámico y grid responsive
- [x] Errores de API con `notify.error(getErrorMessage(...))` — heredado en el hook, sin cambios
- [x] Sin errores 422 nuevos que mapear (no aplica, `PUT` de reemplazo completo)

### Criterios de aceptación (uno a uno)

- [x] El formulario muestra 3 campos nuevos ("Nº de Booking", "País de origen", "País de destino"),
      todos opcionales, tipo texto simple — confirmado en `FIELDS` (líneas 35, 39-40 del componente),
      sin Combobox/Select.
- [x] Guardar persiste los 3 campos; recargar los muestra ya rellenados — confirmado en los 4 puntos
      de sincronización: `FIELDS` (render), `EMPTY_VALUES` (default del form), `reset()` del
      `useEffect` (población desde `shippingDetail?.bookingNumber ?? ''` etc.), y payload de
      `onSubmit` (`data.bookingNumber || null` etc.). Los 3 campos están presentes en los 4 sitios,
      sin omisiones — verificación línea a línea del archivo completo, no solo el diff.
- [x] Guardar sin tocar estos 3 campos no rompe el guardado de los 6+3 existentes — el payload sigue
      enviando los 12 campos siempre (`|| null` uniforme para todos), mismo patrón de reemplazo
      completo ya establecido en GAP-124/126, sin regresión.
- [x] El grid principal se adapta a una columna en mobile — confirmado en línea 157:
      `grid grid-cols-1 gap-3 sm:grid-cols-2`, mismo fix ya validado en GAP-126 para el bloque de
      consignatario, ahora aplicado también al grid de `FIELDS` (que resuelve IDEA-012 del parking
      lot como efecto colateral documentado).
- [x] `readOnly` deshabilita los 3 campos nuevos igual que el resto — están dentro del mismo
      `FIELDS.map()` con `disabled={readOnly || upsertMutation.isPending}` uniforme, sin lógica
      especial por campo.
- [x] `npm run type-check` y `npm run lint` limpios — verificado de forma independiente: type-check
      0 errores; lint 0 errores / 267 warnings preexistentes (mismo número que en la auditoría de
      GAP-126), ninguno en los 3 archivos de código tocados por este GAP.
- [x] Funciona en mobile y desktop — grid responsive verificado en el grid real y en el skeleton
      (`Array.from({ length: FIELDS.length })`, no un literal `6` desactualizado — confirmado que
      `FIELDS.length === 9`).

### Verificación independiente

- Leído `MaritimeShippingDetailForm.tsx` completo (no solo el diff): confirmado que los 3 campos
  nuevos aparecen en los 4 puntos requeridos (`FIELDS`, `EMPTY_VALUES`, `reset()`, payload de
  `onSubmit`) sin ninguna omisión — el motivo exacto por el que GAP-126 tuvo que tocar 3 campos
  análogos en los mismos 4 sitios.
- Guard anti-pisado de borrador (`if (isDirty) return;`, línea 86) intacto, sin cambios respecto a
  GAP-124/126 — no se rompió al ampliar el objeto de `reset()`.
- Rama de error de carga (línea 142, `error ?`) intacta — sigue bloqueando la renderización completa
  del formulario (ahora 12 campos) mientras `error` esté activo, sin reintroducir el bug ya corregido
  en GAP-124.
- Grid del bloque de consignatario final (línea 202, `grid grid-cols-1 gap-3 sm:grid-cols-2`) no
  tocado por este GAP — coincide con la restricción de "no tocar el bloque de consignatario salvo
  el cambio de clase del grid padre compartido" (aquí no hubo clase compartida que tocar, cada grid
  es independiente).
- `git diff --stat` confirma que solo se tocaron los 4 archivos declarados
  (`src/types/orders.ts`, `maritimeShippingDetailSchema.ts`, `MaritimeShippingDetailForm.tsx`,
  `.claude/ideas/parking-lot.md`) — `useOrderMaritimeShippingDetail.ts`,
  `orderMaritimeShippingDetailService.ts` y `useCustomsBrokerOptions.ts` no tocados, tal como
  anticipaba el GAP.
- `.claude/ideas/parking-lot.md`: `git diff` confirma que IDEA-012 existía previamente en "Parked"
  (bug idéntico al ya corregido, sobre el grid original de 6 campos) y se movió correctamente a
  "Promoted" con nota de resolución citando GAP-130. IDEA-011 (skeleton sin bloque de consignatario,
  problema distinto de estructura, no de responsividad) permanece intacta en "Parked", sin tocar por
  error — formato del archivo (encabezados, separadores `---`) sin romper.
- `npm run type-check` (ejecutado de forma independiente) → 0 errores.
- `npm run lint` (ejecutado de forma independiente) → 0 errores, 267 warnings preexistentes; grepeado
  el log completo por los 3 archivos de código de este GAP, ninguno con warning nuevo.
- Sin `fetch()` directo, sin `X-Tenant` hardcodeado, sin archivos `.js` nuevos, sin `any`.

### Observaciones para Jose (no bloqueantes)

- Inconsistencia de longitud máxima ya preexistente (no introducida por este GAP): `bookingNumber`/
  `originCountry`/`destinationCountry` usan `max(100)` (como `voyageNumber`/`swbNumber`), mientras
  `vesselName`/`loadingPort`/`dischargePort` usan `max(255)`. El propio GAP documenta la decisión
  como intencional siguiendo el precedente de campos "cortos de una línea" — correcto, sin acción
  requerida.
- El `Skeleton` sigue sin desglosar visualmente el bloque de consignatario/agente de aduanas (ver
  IDEA-011, aún en Parked) — no es responsabilidad de este GAP, ya señalado como pendiente aparte.

### Revisión Visual

Sin colores hardcodeados, sin `style={{}}`, sin sustitución de componentes shadcn — reutiliza
`Input`/`Label`/`Skeleton` ya existentes, mismo patrón de error inline (`text-red-400`) que el resto
del formulario. El grid responsive (`grid-cols-1 sm:grid-cols-2`) es exactamente el patrón ya
aprobado en GAP-126, aplicado ahora también al grid principal y al skeleton, con dimensiones y
jerarquía consistentes con el resto de la Card.

**Veredicto visual:** ✅ APROBADO

### Revisión UX

**Modo: Light (decisión propia del `gap-auditor`, sin invocar `ux-reviewer`).**

Justificación de por qué Light es suficiente pese a que el formulario pertenece a una entidad
primaria (pedidos): GAP-126 ya pasó por Full Review sobre este mismo componente y ya validó todos
los estados relevantes (guard anti-pisado, rama de error, `readOnly`, mobile). Este GAP no introduce
ningún flujo nuevo, ningún componente nuevo, ninguna interacción multi-estado ni cambio de
navegación/permisos — son 3 `<Input>` de texto simple más dentro del mismo `.map()` ya auditado, y
el único riesgo de UX real conocido para este patrón (grid no responsive) se resolvió de forma
proactiva dentro del propio GAP, no como hallazgo reactivo, y quedó verificado línea a línea en esta
auditoría (línea 157 del componente). No hay superficie nueva que un Full Review pudiera descubrir
que no esté ya cubierta por la Full Review de GAP-126 + la verificación técnica de este GAP.

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-130 — Nº de Booking y países origen/destino en datos de envío marítimo
Mode: Light (extensión acotada de un formulario ya validado en Full Review por GAP-126)

[x] El cambio es autoexplicativo para el usuario — 3 campos de texto con labels claros
    ("Nº de Booking", "País de origen", "País de destino"), sin instrucción adicional necesaria.
[x] No introduce una decisión nueva del usuario sin affordance adecuado — son campos opcionales de
    texto libre, mismo tratamiento que los 6 campos ya existentes (sin placeholder de override
    especial, correctamente, según el propio GAP: no son "override" como ultimateConsigneeName).
[x] Consistente con la UI circundante — mismo `Input`, mismo grid, misma tipografía de `Label`
    y de mensaje de error; sin ruptura visual.
[x] Si es interactivo: hover, focus y active states presentes — heredados del primitivo `Input`
    de shadcn, sin estilos custom.
[x] Si cambió texto: el tono coincide con el resto de la interfaz — labels cortos en español,
    mismo registro que "Buque", "Puerto de carga", etc.; placeholders con formato de ejemplo
    ("ej. BK-2026-0042", "ej. España", "ej. Puerto Rico") igual que el resto de `FIELDS`.

VERDICT: ✅ APROBADO
```

**Veredicto UX:** ✅ APROBADO (Light, sin bloqueantes)

### PL CANDIDATE

Ninguno nuevo — el patrón de riesgo de grid no responsive ya quedó documentado como PL candidate en
la auditoría de GAP-126 (grid `grid-cols-N` fijo sin variante mobile al extender formularios), y este
GAP es precisamente un caso de aplicación correcta de esa lección aprendida (IDEA-012 resuelta de
forma proactiva, no reactiva). No hay hallazgo nuevo no cubierto por los checklists existentes.

### Estado final de la implementación

`src/types/orders.ts`, `maritimeShippingDetailSchema.ts` y `MaritimeShippingDetailForm.tsx` quedan
completos y correctos: los 12 campos (9 heredados + 3 nuevos) se sincronizan, validan y envían como
reemplazo completo del `PUT`, con el guard anti-pisado de borrador y la rama de error de carga de
GAP-124/126 intactos. El grid principal de `FIELDS` y su skeleton correspondiente son ahora
responsive (`grid-cols-1 sm:grid-cols-2`), resolviendo IDEA-012 del parking lot como efecto
colateral documentado. `type-check`/`lint` limpios, verificados de forma independiente. Sin
bloqueantes técnicos, visuales ni de UX. GAP movido a `.claude/gaps/closed/`.
