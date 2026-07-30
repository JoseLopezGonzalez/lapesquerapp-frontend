# GAP-126 — Agente de aduanas y consignatario final en datos de envío marítimo

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose
- **Depende de:** GAP-125 (catálogo `CustomsBroker` y `useCustomsBrokerOptions`)

---

## Contexto y problema

`OrderMaritimeShippingDetail` (implementado en GAP-124, componente
`MaritimeShippingDetailForm.tsx`) gana 3 campos nuevos en el backend:

- `customsBrokerId: number | null` — FK al catálogo `CustomsBroker` (GAP-125). El `GET` del
  recurso devuelve además `customsBroker` (objeto completo resuelto), no solo el id.
- `ultimateConsigneeName: string | null` — override opcional del nombre del consignatario final.
  Si es `null`, el Export Packing List (GAP-129) usa `order.customer.name`.
- `ultimateConsigneeAddress: string | null` — override opcional de la dirección. Si es `null`, el
  documento usa `order.shippingAddress`.

El `PUT` de `maritime-shipping-details` sigue siendo un **reemplazo completo** (ya lo es hoy con
los 6 campos existentes) — estos 3 campos se suman al mismo payload, no crean un endpoint nuevo.

Hoy `MaritimeShippingDetailForm.tsx` renderiza sus 6 campos con un array homogéneo `FIELDS` de
`<Input>` de texto simple (`src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`,
líneas 23-34 y 124-142). El campo `customsBrokerId` no encaja en ese array porque necesita un
selector con búsqueda (Combobox), no un input de texto — hay que sacarlo del `.map()` genérico
sin romper el patrón para los 6 campos existentes.

## Solución acordada

### 1. Tipos (`src/types/orders.ts`)

Ampliar:

```typescript
export interface MaritimeShippingDetail {
  // ...campos existentes sin cambios...
  customsBrokerId: number | string | null;
  customsBroker: CustomsBroker | null; // import desde '@/types/catalog'
  ultimateConsigneeName: string | null;
  ultimateConsigneeAddress: string | null;
}

export interface MaritimeShippingDetailPayload {
  // ...campos existentes sin cambios...
  customsBrokerId?: number | string | null;
  ultimateConsigneeName?: string | null;
  ultimateConsigneeAddress?: string | null;
}
```

### 2. Schema (`schemas/maritimeShippingDetailSchema.ts`)

Añadir `customsBrokerId: z.union([z.number(), z.string()]).nullable().optional()`,
`ultimateConsigneeName`/`ultimateConsigneeAddress`: `z.string().max(255).nullable().optional()`
(revisar longitud real contra la tabla del backend si se conoce; usar 255 por consistencia con
el resto de campos de texto libre del recurso).

### 3. `MaritimeShippingDetailForm.tsx`

- Consumir `useCustomsBrokerOptions()` (GAP-125) para poblar el Combobox.
- Añadir un campo Combobox para `customsBrokerId` **fuera** del `.map()` de `FIELDS` (que sigue
  cubriendo solo los 6 campos de texto), usando `@/components/Shadcn/Combobox` (mismo componente
  que `OrderAuxiliaryLineSheet.tsx`), con `Controller` de react-hook-form (no `register`, porque
  `Combobox` no es un input nativo).
- Añadir `ultimateConsigneeName` (Input) y `ultimateConsigneeAddress` (Textarea, puede tener
  saltos de línea según el ejemplo del backend) como 2 campos adicionales, con
  **placeholder explícito**: "Dejar en blanco para usar los datos del cliente del pedido"
  (`ultimateConsigneeName`) y "Dejar en blanco para usar la dirección de envío del pedido"
  (`ultimateConsigneeAddress`) — checklist del backend lo pide explícitamente.
- Sección visual: agrupar estos 3 campos nuevos bajo un subtítulo dentro de la misma `Card`
  ("Consignatario y agente de aduanas" o similar), separado visualmente de los 6 campos de
  buque/puerto existentes — no mezclar ambos grupos en la misma grid sin distinción, para que el
  usuario entienda que los 2 campos de consignatario son opcionales/override.
- El payload de `onSubmit` sigue enviando **todos** los campos (existentes + 3 nuevos) como
  reemplazo completo, con `|| null` para los 2 campos de texto igual que el resto.
- El `useEffect` de sincronización (`reset(...)` cuando llega `shippingDetail`, guardado contra
  `isDirty`/`error` — ver comentario ya existente en el archivo) se extiende para incluir los 3
  campos nuevos.

### 4. `useOrderMaritimeShippingDetail.ts`

Sin cambios de estructura — el hook ya invalida su propia key y `orderKeys.detail`, y el payload
crece de forma transparente para el hook (no tipa el payload campo a campo).

---

## UI Brief

- **Vista de referencia:** el propio `MaritimeShippingDetailForm.tsx` (extensión in-place) +
  `OrderAuxiliaryLineSheet.tsx` como referencia del patrón `Combobox` + `Controller` dentro de un
  formulario RHF/Zod ya existente en el proyecto.
- **Tipo de layout:** inline dentro de la Card ya existente ("Datos de envío"), no un modal ni
  una Card separada — son datos del mismo recurso 1:1.
- **Componentes clave:** `Combobox` (`@/components/Shadcn/Combobox`), `Controller` de
  react-hook-form, `Textarea` (para `ultimateConsigneeAddress`, admite multilínea), `Label`.
- **Estados requeridos:** el Combobox debe reflejar `isLoading` de `useCustomsBrokerOptions`
  (deshabilitado o con placeholder "Cargando agentes..." mientras carga) — no bloquear el resto
  del formulario mientras tanto, ya que el catálogo de agentes es independiente del propio
  `shippingDetail`.
- **Mobile:** mismo componente, ya ramificado por `useIsMobileSafe` en el padre (`index.tsx`) —
  no requiere lógica nueva de mobile, el Combobox y el Textarea ya son responsive en el resto del
  proyecto.

### Confirmaciones ya cerradas (2026-07-30)

1. Componente de selección para `customsBrokerId` → **Combobox del proyecto** (con búsqueda),
   consumiendo `/customs-brokers/options` — no un `<Select>` estático.

Sin preguntas abiertas — listo para implementar (una vez cerrado GAP-125).

---

## Referencias e inspiración

- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/OrderAuxiliaryLineSheet.tsx`
  (líneas 15, 131-133) — patrón `Combobox` + opciones cargadas por hook, dentro de un formulario
  RHF ya existente.
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`
  — archivo a extender, mantener el `useEffect` anti-pisado de borrador (`isDirty`) y el patrón de
  error de carga ya resuelto (no reintroducir el bug ya corregido en GAP-124: no renderizar el
  formulario si `error` está activo).

## Criterios de aceptación

- [ ] El formulario de datos de envío muestra un Combobox de "Agente de aduanas" con búsqueda,
      poblado desde `/customs-brokers/options`.
- [ ] Seleccionar un agente y guardar persiste `customsBrokerId`; recargar la pestaña muestra el
      agente ya seleccionado (usando `customsBroker` resuelto del `GET`).
- [ ] Los campos "Nombre del consignatario final" y "Dirección del consignatario final" son
      opcionales, con placeholder que indica explícitamente que en blanco se usan los datos del
      cliente/envío del pedido.
- [ ] Guardar sin tocar estos 3 campos nuevos no rompe el guardado de los 6 campos existentes
      (regresión del comportamiento de GAP-124).
- [ ] El Combobox respeta el guard anti-pisado de borrador (`isDirty`) igual que el resto del
      formulario — no se resetea si el usuario tiene un cambio sin guardar en curso.
- [ ] `readOnly` deshabilita el Combobox y los 2 campos de texto igual que los 6 campos
      existentes (no solo ocultar el botón Guardar).
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Funciona en mobile y desktop.

## Archivos a crear o modificar

**Modificar:**
- `src/types/orders.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx`

## Restricciones

- No tocar `useOrderMaritimeShippingDetail.ts` salvo que el tipado del payload lo requiera
  explícitamente (no se anticipa necesario).
- No modificar el mecanismo de reemplazo completo del `PUT` — seguir enviando el objeto entero.
- No introducir un `<Select>` estático — el checklist del backend especifica Combobox/autocomplete.
- No crear archivos `.js` nuevos.
- Reutilizar `readOnly` ya existente en el componente — no introducir un chequeo de rol nuevo.

---

## Implementación

### Archivos modificados

- `src/types/orders.ts` — `MaritimeShippingDetail` y `MaritimeShippingDetailPayload` amplían con
  `customsBrokerId`, `customsBroker` (import `CustomsBroker` desde `@/types/catalog`),
  `ultimateConsigneeName`, `ultimateConsigneeAddress`
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/schemas/maritimeShippingDetailSchema.ts`
  — 3 campos nuevos: `customsBrokerId` (`z.union([z.number(), z.string()]).nullable().optional()`),
  `ultimateConsigneeName`/`ultimateConsigneeAddress` (`z.string().max(255).nullable().optional()`)
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeShippingDetailForm.tsx` —
  Combobox de agente de aduanas (`Controller` + `useCustomsBrokerOptions`), 2 campos de
  consignatario final (Input + Textarea) bajo un `Separator` con subtítulo "Consignatario y
  agente de aduanas", `EMPTY_VALUES`/`reset()`/payload de `onSubmit` extendidos a los 9 campos

### Decisiones tomadas durante la implementación

- `useCustomsBrokerOptions` devuelve `{id, name}[]` (shape plano del backend); el mapeo a
  `{value, label}` que espera `Combobox` se hace localmente en el componente
  (`customsBrokerOptions = customsBrokerOptionsRaw.map(...)`), no en el hook — mantiene el hook
  reutilizable para cualquier consumidor futuro sin acoplarlo a la forma que necesita `Combobox`.
- Valor "sin selección" del Combobox: `null` (no `''`) en `EMPTY_VALUES` y en el `reset()` al
  cargar datos — consistente con el resto de campos numéricos de FK en el proyecto; el propio
  `Combobox` trata `null`/`''` igual (`if (!value) return null`), así que el toggle-deselect
  interno del componente (que emite `''`) no rompe nada al pasar por `|| null` en el submit.
- Verificado que `isDirty` de React Hook Form se activa correctamente también para el campo
  gestionado por `Controller` (no solo los `register`) — es el mismo `formState` compartido, así
  que el guard anti-pisado de borrador (`if (isDirty) return;` en el `useEffect` de sincronización)
  cubre el Combobox sin cambios adicionales.
- Sección visual separada con `<Separator />` + subtítulo `text-muted-foreground text-xs
  font-medium` — mismo patrón ya usado en `OrderDocuments/index.tsx` para el label "Documentos"
  bajo un `Separator`, en vez de inventar un estilo nuevo de agrupación.
- `.d.ts` de `@/components/Shadcn/Combobox` (componente `.js` con tipos escritos a mano) auditado
  contra su implementación real antes de usarlo — coinciden (props `options`, `value`, `onChange`,
  `loading`, `disabled`, etc.), sin necesidad de tocar el `.d.ts`.

### Desviaciones del plan

Ninguna — todos los archivos coinciden con la lista acordada en el GAP.

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, sin warnings nuevos en los 3 archivos tocados por este GAP.

### Fix tras Full UX Review (❌ REJECTED → corregido)

El `ux-reviewer` encontró un bloqueante: el grupo "Nombre del consignatario final"/"Dirección del
consignatario final" usaba `grid-cols-2` fijo sin variante mobile, comprimiendo cada campo a
~165px en un viewport de ~375px (afectando sobre todo al `Textarea` de dirección postal) —
contradecía el UI Brief, que asumía que el grupo ya era responsive.

**Fix aplicado:** `MaritimeShippingDetailForm.tsx` línea 190, `grid grid-cols-2 gap-3` →
`grid grid-cols-1 gap-3 sm:grid-cols-2` (patrón CSS-based ya documentado como alternativa válida
en `design-context.md` §Forms, sin necesidad de importar `useIsMobileSafe`). Ahora el grupo
apila a una columna por debajo del breakpoint `sm` (640px) y vuelve a 2 columnas en desktop.

`npm run type-check` re-verificado limpio tras el fix.

---

## Revisión UX

```
UX REVIEW — FULL
════════════════
GAP: GAP-126 — Agente de aduanas y consignatario final en datos de envío marítimo
Reviewer: ux-reviewer agent
Mode: Full
```

**Motivo de Full Review:** extiende un formulario sobre una entidad primaria (pedidos) que ya
requirió Full Review en GAP-124; añade un componente de selección nuevo (Combobox + Controller)
con estados asíncronos propios (loading/vacío del catálogo) y toca el guard anti-pisado de
borrador ya corregido en la revisión anterior.

### FLOW SIMULATION

Steps simulated: 8
User roles covered: Admin/Dirección (edición completa), Comercial (`readOnly=true`)
Edge cases covered: Combobox loading, catálogo vacío, `readOnly`, recarga con id ya guardado,
guard anti-pisado de borrador, mobile, error de carga heredado

**Rol: Admin/Dirección — Entry point: pestaña "Exportación marítima" ya abierta, Card "Datos de envío"**

1. **Flujo feliz.** El usuario abre el Combobox "Agente de aduanas" (ya cargado), busca por
   nombre, selecciona uno → `field.onChange` marca `isDirty=true` → botón "Guardar" se habilita.
   Rellena "Nombre del consignatario final", deja en blanco "Dirección del consignatario final" →
   Guardar → payload envía los 9 campos (`ultimateConsigneeAddress: null` por el `|| null` del
   `onSubmit`) → éxito → `reset(data)` dejar el formulario limpio de inmediato. → Sin fricción.

2. **Combobox en `loading` (catálogo `/customs-brokers/options` aún resolviendo).** El botón
   muestra "Cargando opciones..." (gris, con `Loader2` girando en vez del `ChevronsUpDown`) y el
   propio `CommandInput`/`CommandList` quedan deshabilitados si se llega a abrir. No hay
   ambigüedad con "no hay agentes" — el texto es explícito y el spinner refuerza que es un estado
   transitorio, no un catálogo vacío. → Coincide con el UI Brief. ✅

3. **Catálogo de agentes vacío (ningún `CustomsBroker` creado).** Tras resolver la carga con
   `options=[]`, el botón cerrado muestra el placeholder normal ("Seleccionar agente de
   aduanas..."), indistinguible de un catálogo con datos que el usuario aún no ha explorado. Solo
   al abrir el popover se ve `notFoundMessage` ("No se encontraron agentes de aduanas"). Es el
   mismo comportamiento que cualquier otro `Combobox` del proyecto (`OrderAuxiliaryLineSheet`
   incluido) — no es una regresión de este GAP, es el patrón ya aceptado en el resto de la app, así
   que no lo elevo a hallazgo nuevo, aunque como observación general un catálogo recién creado
   (GAP-125) con 0 registros no se comunica hasta que el usuario abre el desplegable.

4. **`readOnly=true` (Comercial).** `disabled={readOnly || upsertMutation.isPending}` deshabilita
   el `Button` interno del Combobox con `disabled:opacity-50` — mismo tratamiento visual que
   `Input`/`Textarea` deshabilitados (`disabled:opacity-50` + `disabled:bg-input/50` en estos
   últimos). Ligera diferencia de fondo (el `Button` no aplica un tinte de fondo al deshabilitarse,
   los campos de texto sí), pero ambos comunican con claridad que no son interactivos — no es una
   inconsistencia introducida por este GAP, es la diferencia estándar entre los primitivos `Button`
   y `Input` de shadcn en todo el proyecto. No bloqueante.

5. **Recarga con `customsBrokerId` ya guardado, mientras las opciones aún cargan.** Verificado en
   `Combobox/index.js`: si `value` está poblado pero `loading=true` y `options` todavía está vacío
   (la query de opciones no ha resuelto), la rama `value ? (loading ? 'Cargando...' : String(value)) : placeholder`
   se activa y muestra "Cargando..." en gris — **nunca llega a pintar el id numérico crudo**
   mientras carga. Cuando las opciones resuelven, `selectedOption` se recalcula y el label real del
   agente reemplaza al texto de carga sin salto perceptible. → Comportamiento correcto, sin
   necesidad de cambios; destacar como acierto. ✅

6. **Guard anti-pisado de borrador con el campo nuevo.** Simulado paso a paso: usuario abre el
   Combobox y selecciona un agente (o cambia de opinión sin seleccionar aún, dejando el popover
   abierto) → `isDirty` pasa a `true` en cuanto `field.onChange` se dispara (confirmado: es el
   mismo `formState` compartido de RHF, no hay `formState` separado para campos con `Controller`) →
   el usuario cambia de pestaña del navegador y vuelve → `refetchOnWindowFocus` dispara un refetch
   en segundo plano → el `useEffect` de sincronización reevalúa pero `isDirty` sigue `true` →
   `return` antes de `reset()` → el borrador (incluida la selección del Combobox) se conserva. Si
   el usuario aún no ha seleccionado nada (solo abrió el popover sin elegir), `isDirty` sigue
   `false` y un refetch en segundo plano sí resetea el formulario — comportamiento correcto, no hay
   nada que preservar en ese caso. ✅ El fix de GAP-124 sigue intacto y cubre el campo nuevo sin
   cambios adicionales.

7. **Error de carga heredado (fetch inicial de `shippingDetail`).** Rama `error` sin tocar —
   sustituye el formulario completo (los 9 campos, no solo los 6 antiguos) por el mensaje +
   "Reintentar". Verificado que el Combobox y los 2 campos nuevos nunca se renderizan mientras
   `error` esté activo, igual que los 6 campos existentes. ✅ No se reintrodujo el bug de GAP-124.

8. **Mobile — Combobox y Textarea nuevos dentro de la Card, layout de una sola columna.**
   ❌ **No se cumple.** El contenedor padre (`OrderMaritimeExport/index.tsx`) sí rama
   correctamente `isMobile` para apilar las dos Cards en columna única, pero
   `MaritimeShippingDetailForm.tsx` no recibe ni usa `isMobile`/`useIsMobileSafe` internamente: el
   grupo nuevo "Nombre del consignatario final" + "Dirección del consignatario final" está envuelto
   en `<div className="grid grid-cols-2 gap-3">` (línea 190) **sin variante responsive** — el mismo
   `grid-cols-2` fijo se aplica en mobile y en desktop. En un viewport de ~375px, con el padding de
   `CardContent` (`px-4` = 16px por lado, sin excepción mobile) y el `gap-3` del grid, cada columna
   queda en ~165px de ancho. El `Textarea` de dirección (pensado para una dirección postal
   completa, potencialmente multilínea) queda comprimido a ese ancho, y el `Input` de nombre
   igual — además el `placeholder` largo ("Dejar en blanco para usar la dirección de envío del
   pedido") se trunca de forma agresiva en ese ancho, perdiendo parte de la instrucción que el
   propio GAP pidió que fuera explícita. El `Label` "Dirección del consignatario final" también
   queda forzado a envolver en 2 líneas sobre una caja muy estrecha.
   → Existe precedente ya resuelto en el mismo dominio para exactamente este problema:
   `OrderEditSheet/index.tsx` (línea 829) usa
   `` `grid gap-4 pt-2 ${isMobile ? 'grid-cols-1' : group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}` ``
   — el propio proyecto ya resuelve este caso con `isMobile` condicionando el número de columnas.
   → Nota: la grid `grid-cols-2` de los 6 campos preexistentes (`FIELDS.map`, línea 145) tiene el
   mismo problema estructural, pero es heredado de GAP-124 (no tocado por este GAP) y sus valores
   son cortos ("Vigo", "V-2026-045"), por lo que el impacto es menor — lo señalo como observación,
   no como bloqueante de este GAP. El caso de la dirección del consignatario es distinto en
   severidad porque el contenido (dirección postal completa) sí necesita el ancho completo.

### Edge cases simulados

**→ Empty state (catálogo de agentes vacío):** ver Step 3 — comportamiento heredado y consistente
con el resto de Comboboxes del proyecto, no es una regresión.

**→ Error state:** ver Step 7 — heredado y verificado intacto, cubre los 3 campos nuevos.

**→ Partial data:** un `shippingDetail` con `customsBrokerId` poblado pero `ultimateConsigneeName`/
`ultimateConsigneeAddress` en `null` se muestra correctamente campo a campo (`?? ''`/`?? null` por
campo, mismo patrón que los 6 campos existentes). ✅

**→ Permission edge (`readOnly`):** ver Step 4 — Combobox deshabilitado igual que el resto del
formulario, botón "Guardar" oculto (heredado, sin cambios). ✅

**→ Concurrent action:** mismo riesgo ya aceptado en GAP-124 (`PUT` de reemplazo completo sin
locking optimista) — el campo `customsBrokerId` no añade un vector nuevo, es "last write wins"
igual que el resto del recurso. No es un hallazgo nuevo de este GAP.

**→ Mobile:** ver Step 8 — hallazgo bloqueante nuevo, específico de los 2 campos añadidos por este
GAP.

### FINDINGS

✅ **Funciona bien:**
- El Combobox nunca muestra el id numérico crudo mientras el catálogo de opciones carga con un
  valor ya seleccionado — pasa por un estado intermedio "Cargando..." explícito (Step 5).
- El estado `loading` del Combobox es inequívoco frente a "catálogo vacío" (Step 2) — texto y
  spinner dedicados, no hay ambigüedad.
- El guard anti-pisado de borrador (`isDirty` antes de `reset()`, corregido en GAP-124) cubre el
  campo gestionado por `Controller` sin cambios adicionales — verificado paso a paso (Step 6).
- La rama de `error` de carga sigue bloqueando la renderización de todo el formulario (los 9
  campos, no solo los 6 antiguos), preservando el fix de GAP-124 frente al riesgo de sobrescritura
  silenciosa vía el `PUT` de reemplazo completo.
- `readOnly` deshabilita el Combobox de forma coherente con el resto de campos.
- Placeholders explícitos en los 2 campos de consignatario, tal como pedía el criterio de
  aceptación (visibles y correctos en desktop).

⚠️ **Fricciones (no bloqueantes):**
- El `Skeleton` de carga inicial (`isLoading`, líneas 121-129) solo reserva espacio para los 6
  campos preexistentes — no incluye ningún placeholder para el `Separator` + los 3 campos nuevos
  (Combobox + nombre + dirección). El usuario ve un salto de layout (la Card crece de golpe) al
  terminar de cargar, en vez de un skeleton con la forma final del contenido — viola parcialmente
  el principio "Loading states match the shape of the content they replace" (§8.4
  `design-context.md`). Recomendado para una iteración menor, no bloquea el cierre.
- La grid `grid-cols-2` fija de los 6 campos preexistentes (heredada de GAP-124, no tocada aquí)
  comparte el mismo problema estructural que el hallazgo bloqueante del Step 8, aunque con impacto
  menor por el tipo de contenido (valores cortos). Recomiendo resolver ambos grupos a la vez si se
  toca el archivo para corregir el bloqueante.
- Catálogo de agentes vacío indistinguible de "catálogo con datos no explorados" hasta abrir el
  popover — patrón heredado de todos los Combobox del proyecto, no específico de este GAP.

❌ **Bloqueantes:**
1. **Layout no responsive de los 2 campos de consignatario en mobile (Step 8).** El grupo
   "Nombre del consignatario final" / "Dirección del consignatario final" usa `grid-cols-2` fijo
   sin variante para mobile, comprimiendo ambos campos (especialmente el `Textarea` de dirección
   postal completa) a ~165px de ancho en un viewport típico de ~375px, y truncando los placeholders
   explícitos que el propio GAP pidió como requisito. Contradice el UI Brief del GAP ("el Combobox
   y el Textarea ya son responsive... no requiere lógica nueva de mobile") y el criterio de
   aceptación "Funciona en mobile y desktop" en su sentido de usabilidad real, no solo de ausencia
   de errores. Existe precedente ya resuelto en el propio dominio (`OrderEditSheet/index.tsx`,
   línea 829: `` isMobile ? 'grid-cols-1' : ... `` ) que resuelve exactamente este caso.
   **Cambio requerido:** condicionar el grid del bloque de consignatario (y, si se toca el archivo,
   idealmente también el de los 6 campos existentes) a `grid-cols-1` en mobile — bien pasando
   `isMobile` desde `OrderMaritimeExport/index.tsx` como prop a `MaritimeShippingDetailForm`, bien
   usando `useIsMobileSafe()` directamente dentro del propio componente, siguiendo el patrón ya
   usado en `OrderEditSheet/index.tsx`.

### UX PRINCIPLES CHECK (§8 design-context.md)

1. Confirmación en acciones destructivas: N/A (no aplica, sin acciones destructivas nuevas)
2. Mobile como render path separado: ⚠️ — el contenedor padre sí rama correctamente, pero el
   formulario en sí no propaga esa rama a su grid interno para los campos nuevos (ver bloqueante).
3. Datos siempre vía TanStack Query: ✅ — `useCustomsBrokerOptions` sigue el patrón estándar.
4. Loading states con la forma del contenido que reemplazan: ⚠️ — skeleton no actualizado para
   reflejar el bloque nuevo (fricción, no bloqueante).
5. Configuración declarativa de entidades: N/A
6. Errores en el nivel correcto, nunca mezclados: ✅ — heredado de GAP-124, intacto.
7. Densidad alta, chrome mínimo: ✅
8. Iconos Lucide-only: ✅ (sin iconos nuevos añadidos por este GAP en el Combobox más allá de los
   ya incluidos en el propio componente)

### VERDICT (primera pasada): ❌ REJECTED

**Cambios específicos requeridos antes de re-revisión:**

1. Hacer responsive el grid del bloque "Nombre del consignatario final" / "Dirección del
   consignatario final" en `MaritimeShippingDetailForm.tsx` (línea 190) — `grid-cols-1` en mobile,
   `grid-cols-2` en desktop, siguiendo el patrón ya usado en `OrderEditSheet/index.tsx` (línea 829).
   Verificar en el mismo cambio que el `Textarea` de dirección y el `Input` de nombre tienen ancho
   completo en mobile y que los placeholders explícitos son legibles sin truncar agresivamente.

No es necesario resolver las fricciones no bloqueantes (skeleton incompleto, grid heredado de los
6 campos antiguos) para este cierre, pero se recomienda evaluarlas en la misma pasada si se toca el
archivo.

Score (primera pasada): 6/10

---

### Re-verificación (2026-07-30, tras fix)

**Fix aplicado:** `MaritimeShippingDetailForm.tsx` línea 190, `grid grid-cols-2 gap-3` →
`grid grid-cols-1 gap-3 sm:grid-cols-2` (ver subsección "Fix tras Full UX Review" en
`## Implementación`).

**Verificación puntual del bloqueante:**

- Leído el archivo completo tras el fix. Confirmado en línea 190:
  `<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">`. Por debajo del breakpoint `sm`
  (640px, Tailwind default) el bloque apila a una columna — en un viewport de ~375px, tanto el
  `Input` de "Nombre del consignatario final" como el `Textarea` de "Dirección del consignatario
  final" ocupan el ancho completo del `CardContent` (~343px tras el `px-4` del Card), en vez de los
  ~165px comprimidos que motivaron el bloqueante. El `Textarea` de dirección ya tiene espacio
  adecuado para una dirección postal completa, y los placeholders explícitos
  ("Dejar en blanco para usar...") dejan de truncarse de forma agresiva.
- Nota de precisión: el breakpoint usado (`sm` = 640px, media query CSS) no coincide exactamente
  con el breakpoint de `useIsMobileSafe()` que rama el contenedor padre (768px, ver
  `src/hooks/use-mobile.jsx`). Esto deja una franja de ~640-767px de ancho de ventana donde el
  contenedor padre todavía considera "mobile" (Cards apiladas a ancho completo) pero el grupo
  interno ya vuelve a 2 columnas. En la práctica esto no es un problema: a esos anchos (640-767px)
  cada columna dispone de ~300px+ (layout mobile sin sidebar), suficiente para ambos campos sin
  compresión — no reintroduce el bloqueante original, que era específico de viewports de teléfono
  (~375-414px, bien por debajo de 640px). Lo dejo anotado como observación menor, no bloqueante.
- **No rompe el resto del formulario:**
  - Grupo de 6 campos existentes (`FIELDS.map`, línea 145): sin cambios, sigue en `grid-cols-2`
    fijo (heredado de GAP-124, fuera del alcance de este fix puntual, ya señalado como observación
    no bloqueante en la primera pasada).
  - Combobox "Agente de aduanas" (línea 170): sin cambios, sigue en su propio `div` de una sola
    columna (`grid gap-2`), ancho completo en cualquier viewport — no afectado por el fix.
  - Layout desktop (>=640px): `sm:grid-cols-2` reproduce exactamente el mismo layout de 2 columnas
    que existía antes del fix — sin regresión visual en desktop.
  - `npm run type-check` ejecutado de nuevo de forma independiente: limpio (0 errores), confirma lo
    reportado por el coordinador.
  - Guard anti-pisado de borrador, rama de `error`, y estados del Combobox (loading/catálogo
    vacío/readOnly/recarga con id ya guardado) no fueron tocados por este fix — siguen intactos tal
    como se verificó en la Full Review original.

### VERDICT (re-verificación): ✅ APPROVED WITH OBSERVATIONS

El bloqueante queda resuelto. Observaciones para seguimiento (no condicionan el cierre de GAP-126):

1. El `Skeleton` de carga inicial (líneas 121-129) sigue sin reservar espacio para el bloque
   "Consignatario y agente de aduanas" — salto de layout al terminar de cargar (fricción ya
   señalada en la primera pasada, sin cambios).
2. El grupo de 6 campos preexistentes (`FIELDS.map`) mantiene el mismo `grid-cols-2` fijo sin
   variante mobile — impacto menor por el tipo de contenido (valores cortos), pero comparte la
   misma causa raíz que el bloqueante ya corregido. Recomendado resolver junto con el punto 1 en
   una iteración de pulido, no bloqueante para este cierre.
3. Catálogo de agentes vacío indistinguible de "catálogo no explorado" hasta abrir el popover —
   patrón heredado de todos los Combobox del proyecto, no específico de este GAP.

Score: 8.5/10

---

## Auditoría

### Resultado: ✅ APROBADO CON OBSERVACIONES

> Primera pasada técnica/visual: sin bloqueantes. La Full UX Review del `ux-reviewer` sí encontró
> un bloqueante (grid `grid-cols-2` fijo sin variante mobile en el bloque de consignatario final,
> comprimiendo el `Textarea` de dirección a ~165px en viewports de teléfono) — resuelto con el fix
> de una línea (`grid-cols-1 gap-3 sm:grid-cols-2`) y re-verificado por el propio `ux-reviewer`
> (segunda pasada: ✅ APPROVED WITH OBSERVATIONS, 8.5/10). Verificación técnica independiente tras
> el fix: `git diff` confirma que el diff completo coincide exactamente con lo documentado en
> "Implementación" (incluida la línea 190 del fix), `npm run type-check` → 0 errores, `npm run
> lint` → 0 errores / 267 warnings preexistentes, ninguno nuevo en los 3 archivos tocados.

### Puntuación: 9/10 — implementación fiel al GAP en tipos, schema y componente, con guard
anti-pisado de borrador y rama de error de carga verificados intactos para los 3 campos nuevos.
Resto un punto por el mismo motivo que penalizó la Full UX Review (8.5/10): el bloqueante de
responsividad debió detectarse antes de la primera pasada de revisión, dado que el propio GAP
advertía explícitamente "no mezclar ambos grupos... para que el usuario entienda" y el proyecto ya
tenía precedente (`OrderEditSheet/index.tsx:829`) para este exacto patrón de grid condicional por
mobile.

### Checklist

- [x] Criterios de aceptación cumplidos (8/8, ver detalle abajo)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] `useLabelEditor.ts` sin lógica nueva; `useOrder`/`usePallet`/`useOrderMaritimeShippingDetail.ts`
      no tocados (confirmado — GAP no lo requería, y el diff no los incluye)
- [x] `entitiesConfig.js`/`entitiesConfig.admin.ts` no tocados (fuera del alcance de este GAP)
- [x] Patrones de `.claude/rules/` respetados (Controller para campo no-nativo, queryKeys factory
      ya existente reutilizada sin cambios, Skeleton/error inline con `notify`/mensajes ya usados)
- [x] Nomenclatura correcta
- [x] `queryKeys` de `useCustomsBrokerOptions`/`useOrderMaritimeShippingDetail` sin tocar — factories
      ya existentes de GAP-125/GAP-124
- [x] Loading states con Skeleton (heredado, sin regresión); observación no bloqueante: el Skeleton
      no se extendió para reservar espacio al bloque nuevo (ver Revisión UX, fricción 1)
- [x] Errores de API con `notify.error(getErrorMessage(...))` — heredado en el hook, sin cambios
- [x] Sin errores 422 nuevos que mapear en este formulario (no aplica, el `PUT` de reemplazo
      completo no expone validación de campo individual en este flujo)

### Criterios de aceptación (uno a uno)

- [x] Combobox de "Agente de aduanas" con búsqueda, poblado desde `/customs-brokers/options` vía
      `useCustomsBrokerOptions()` — confirmado en el componente y sin cambios al hook (GAP-125).
- [x] Seleccionar y guardar persiste `customsBrokerId`; recarga muestra el valor ya guardado —
      confirmado por lectura del `useEffect` de sincronización y por el comportamiento verificado
      del `Combobox` con `value` poblado mientras `loading=true` (nunca pinta el id crudo, ver
      Revisión UX Step 5).
- [x] "Nombre"/"Dirección del consignatario final" opcionales con placeholder explícito exacto al
      texto pedido por el GAP — confirmado literal en el JSX.
- [x] Guardar sin tocar los 3 campos nuevos no rompe el guardado de los 6 existentes — el payload
      sigue enviando los 9 campos siempre (`|| null` uniforme), sin regresión de GAP-124.
- [x] El Combobox respeta el guard `isDirty` — confirmado que `Controller` comparte el mismo
      `formState` que `register()`, verificado paso a paso en la Full UX Review (Step 6).
- [x] `readOnly` deshabilita el Combobox y los 2 campos de texto igual que los 6 existentes —
      `disabled={readOnly || upsertMutation.isPending}` presente en los 3 elementos nuevos.
- [x] `npm run type-check` y `npm run lint` limpios — verificado de forma independiente dos veces
      (antes y después del fix de responsividad), 0 errores ambas veces.
- [x] Funciona en mobile y desktop — solo tras el fix de responsividad; verificado por el
      `ux-reviewer` en la re-verificación (línea 190 confirmada, layout de una columna por debajo de
      `sm`, 2 columnas por encima, sin regresión en desktop).

### Verificación independiente

- Leído `MaritimeShippingDetailForm.tsx`, `maritimeShippingDetailSchema.ts` y `src/types/orders.ts`
  completos, no solo el diff — el `Combobox` usa el patrón correcto comparado línea a línea contra
  `OrderAuxiliaryLineSheet.tsx` (mismo componente, opciones `{value, label}`, `Controller` en vez de
  `register`).
- `customsBrokerOptionsRaw.map(broker => ({value: broker.id, label: broker.name}))` sin bugs de
  mapeo (sin ids duplicados posibles dado que `id` es PK del backend); la falta de `useMemo` es un
  nit de rendimiento, no un problema real — el catálogo de agentes de aduanas es previsiblemente
  pequeño (decenas, no miles de registros) y el recálculo en cada render es trivial. No bloqueante.
- Grepeados todos los usos de `MaritimeShippingDetail`/`MaritimeShippingDetailPayload` en el repo:
  únicamente `orderMaritimeShippingDetailService.ts` y `useOrderMaritimeShippingDetail.ts` los
  consumen, ninguno de los dos tocado ni roto por la ampliación de campos.
- `git diff` de los 3 archivos revisado de punta a punta: coincide exactamente con lo documentado en
  "Implementación" y en el "Fix tras Full UX Review", sin cambios no anticipados.
- `npm run type-check` → 0 errores (ejecutado por mí, dos veces, antes y después del fix).
- `npm run lint` → 0 errores, 267 warnings — mismos preexistentes; grepeado el log completo por los
  3 archivos de este GAP, ninguno con warning nuevo.
- Sin `fetch()` directo, sin `X-Tenant` hardcodeado, sin archivos `.js` nuevos, sin `any`, sin
  colores/estilos inline hardcodeados en el componente.

### Observaciones para Jose (no bloqueantes)

- El `Skeleton` de carga inicial (líneas 121-129) no reserva espacio para el bloque nuevo
  "Consignatario y agente de aduanas" — hay un salto de layout perceptible cuando la carga termina.
  Vale la pena una iteración menor que añada 3 placeholders más (Combobox + 2 campos) al Skeleton
  existente.
- El grid `grid-cols-2` fijo de los 6 campos originales (`FIELDS.map`, línea 145, heredado de
  GAP-124) comparte la misma causa raíz que el bloqueante ya corregido en este GAP, aunque con
  impacto menor porque sus valores son cortos ("Vigo", "V-2026-045"). Recomiendo resolverlo en la
  misma pasada de pulido que el punto anterior, ya que el archivo se va a tocar de todos modos.
- Considera memoizar `customsBrokerOptions` con `useMemo` si el catálogo llega a crecer
  significativamente — no es necesario hoy.

### Revisión Visual

Sin colores hardcodeados, sin `style={{}}`, sin sustitución de componentes shadcn — reutiliza
`Card`/`Input`/`Textarea`/`Label`/`Separator`/`Combobox` ya existentes en el proyecto. Agrupación
visual con `Separator` + subtítulo `text-muted-foreground text-xs font-medium` calca el patrón ya
usado en `OrderDocuments/index.tsx`. Patrón de error inline (`text-red-400`) es el mismo ya usado
en los 6 campos preexistentes, no una introducción nueva. Único hallazgo visual real (el grid no
responsive) fue detectado por la Full UX Review y ya está corregido — ver arriba.

**Veredicto visual:** ✅ APROBADO

### Revisión UX

Full UX Review ejecutada por `ux-reviewer` (ver sección `## Revisión UX` arriba). Primera pasada:
❌ REJECTED (1 bloqueante: grid fijo sin variante mobile en el bloque de consignatario final,
contradiciendo el UI Brief y el criterio de aceptación "Funciona en mobile y desktop"). Tras aplicar
el fix (`grid-cols-1 gap-3 sm:grid-cols-2`), segunda pasada: ✅ **APROBADO CON OBSERVACIONES
(8.5/10)**, sin bloqueantes restantes.

**Veredicto UX:** ✅ APROBADO CON OBSERVACIONES

### PL CANDIDATE

Dos catálogos de aprendizaje potencial de este GAP:

1. **Grid `grid-cols-N` fijo sin variante mobile es un patrón de riesgo recurrente al extender
   formularios ya existentes.** GAP-124 ya tenía este problema latente en sus 6 campos originales
   (no detectado entonces porque sus valores son cortos); GAP-126 lo reintrodujo de forma más grave
   en un campo con contenido largo (dirección postal + placeholder largo). El proyecto ya tiene el
   patrón correcto documentado en código (`OrderEditSheet/index.tsx:829`,
   `isMobile ? 'grid-cols-1' : ...`) pero no en ninguna regla de `.claude/rules/` ni en
   `design-context.md` de forma explícita y buscable. Vale la pena una regla explícita: "todo
   `grid grid-cols-N` con N>1 dentro de un formulario debe usar `grid-cols-1 sm:grid-cols-N` (o
   `isMobile` explícito) salvo que el contenido de las columnas sea garantizadamente corto (badges,
   números de pocos dígitos)".
2. El checklist técnico del propio `gap-auditor` no cubre explícitamente la responsividad de grids
   en formularios — este hallazgo solo se detectó porque el `ux-reviewer` simuló el viewport mobile
   paso a paso. Confirma el valor de la Full UX Review obligatoria para GAPs que tocan entidades
   primarias, incluso en extensiones aparentemente pequeñas de un formulario ya aprobado.

### Estado final de la implementación

`src/types/orders.ts`, `schemas/maritimeShippingDetailSchema.ts` y
`MaritimeShippingDetailForm.tsx` están completos y correctos: los 9 campos (6 heredados + 3 nuevos)
se sincronizan, validan y envían como reemplazo completo del `PUT`, con el guard anti-pisado de
borrador y la rama de error de carga de GAP-124 intactos. El Combobox de agente de aduanas sigue el
patrón `Controller`+`Combobox` ya establecido en `OrderAuxiliaryLineSheet.tsx`, y los 2 campos de
consignatario final tienen placeholders explícitos y son responsive tras el fix aplicado durante la
Full UX Review. `type-check`/`lint` limpios, verificados de forma independiente dos veces. Sin
bloqueantes técnicos, visuales ni de UX. GAP movido a `.claude/gaps/closed/`.
