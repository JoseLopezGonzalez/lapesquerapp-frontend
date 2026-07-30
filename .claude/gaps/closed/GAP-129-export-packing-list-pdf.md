# GAP-129 — Descarga PDF Export Packing List por contenedor

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose
- **Depende de:** GAP-124 (contenedores, ya cerrado), idealmente posterior a GAP-128 (asignación
  de palets) para que el botón pueda avisar de forma fiable si el contenedor está vacío.

---

## Contexto y problema

El backend expone un endpoint de descarga directa por contenedor:

```
GET /api/v2/orders/{order}/maritime-containers/{container}/pdf/export-packing-list
```

`Content-Type: application/pdf`, `Content-Disposition: attachment` — mismo patrón de descarga que
el resto de PDFs del pedido (`packing-list`, `CMR`, `loading-note`), pero **por contenedor**, no
uno por pedido: si el pedido tiene 2 contenedores, hay 2 documentos distintos, cada uno con solo
la mercancía (palets) asignada a ese contenedor.

No disponible para rol `comercial` (403), igual que `packing-list`/`CMR`/`loading-note`.

Contenido del documento (fijo desde backend, no configurable desde frontend): cabecera estándar,
bloque Shipper/Intermediate Consignee (agente de aduanas, o aviso si no hay)/Ultimate Consignee,
metadatos (factura, buque, viaje, contenedor, precinto, SWB, países, incoterm), tabla de mercancía
por especie/producto (cajas, peso kg/lb, HTSUS si está informado), fila TOTAL.

**Importante (ya documentado por el backend):** este documento **no** está integrado en el flujo
de envío por email (`exportDocuments`/`sendCustomDocuments` en `useOrderDocuments.ts`) porque ese
flujo asume un documento por pedido, no por contenedor. Este GAP es **solo descarga directa** — no
tocar `useOrderDocuments.ts` ni el flujo de "enviar documentos".

El patrón de descarga genérico del proyecto (`downloadFileGeneric`,
`src/services/generic/entityService.ts`) sirve tal cual, pero la URL de este endpoint no encaja
en el helper `getOrderExportUrl` de `orderDocumentService.ts` (que asume
`orders/{id}/{type}/{documentName}`) — este es `orders/{id}/maritime-containers/{containerId}/pdf/export-packing-list`,
así que necesita su propia función, no una reutilización de `downloadDocument`.

## Solución acordada

### 1. Service

Añadir a `src/services/domain/orders/orderMaritimeContainerService.ts` (o al service creado en
GAP-128 si ya existe un archivo hermano más cohesivo — decidir en implementación, evitar
duplicar lógica de URL):

```typescript
async downloadExportPackingList(
  orderId: number | string,
  containerId: number | string,
  fileName: string
): Promise<boolean> {
  const url = `${API_URL_V2}orders/${orderId}/maritime-containers/${containerId}/pdf/export-packing-list`;
  return downloadFileGeneric(url, fileName, 'pdf');
}
```

### 2. `MaritimeContainersList.tsx`

- Botón "Descargar Export Packing List" por cada contenedor de la lista (no uno solo por
  pedido), junto a los botones de editar/borrar ya existentes en cada card.
- **Deshabilitar** el botón (con tooltip o texto de ayuda) si el contenedor no tiene ningún palet
  asignado (`container.palletIds` vacío o `null`) — evita descargar un PDF vacío/inútil. Si
  GAP-128 aún no está implementado cuando se ejecute este GAP, usar `palletIds` tal cual venga
  del backend (puede ser `null` si la relación no se cargó — en ese caso, no bloquear el botón,
  solo bloquear cuando se confirma explícitamente que el array está vacío).
- Estado de descarga en curso: `Loader2` + disabled en el botón mientras
  `downloadExportPackingList` está en vuelo (patrón `isDownloading...` local, igual que
  `downloadPalletExpeditionLabel` en `useOrderPallets.ts`).
- Ocultar (no solo deshabilitar) el botón completo para rol `comercial`, mismo patrón que
  `canPrintExpeditionLabels` en `useOrderPallets.ts`/`PalletView/index.tsx` (`!roles.includes('comercial')`).
- Manejo de errores: `notify.error(getErrorMessage(...))` en caso de fallo de descarga (incluye
  403 si por algún motivo se alcanza sin el gating de UI, y cualquier error genérico del backend).

---

## UI Brief

- **Vista de referencia:** `useOrderPallets.ts` — `downloadPalletExpeditionLabel(palletId)` +
  patrón de botón con estado de descarga local (`isDownloading` + `Loader2`), que es el patrón
  más cercano a "botón PDF por ítem hijo" ya existente en el proyecto (a diferencia de
  `OrderExport/index.tsx`, que es un único documento por pedido vía catálogo estático).
- **Tipo de layout:** botón inline dentro de cada card de contenedor en
  `MaritimeContainersList.tsx` — no un modal ni una sección nueva.
- **Componentes clave:** `Button` (variant `outline` o `ghost`, consistente con los botones de
  editar/borrar ya presentes en la card), icono `BsFileEarmarkPdf` (mismo icono que
  `OrderExport/index.tsx` usa para PDFs) o `FileDown`/`Download` de lucide-react — elegir el que
  ya predomine en el resto de la pestaña del pedido para consistencia.
- **Estados requeridos:** disabled + tooltip/texto cuando el contenedor no tiene palets;
  `Loader2` durante la descarga; `notify.error` en fallo.
- **Mobile:** mismo componente — `MaritimeContainersList.tsx` ya ramifica mobile/desktop
  internamente (Dialog full-screen en mobile para crear/editar), el botón de descarga se añade a
  la card en ambos layouts sin lógica nueva de mobile.

### Confirmaciones ya cerradas (2026-07-30)

Ninguna pregunta abierta — el comportamiento está completamente especificado por el backend
(gating por rol ya resuelto con el patrón existente, deshabilitado si no hay palets ya decidido
arriba).

---

## Referencias e inspiración

- `src/services/generic/entityService.ts` (`downloadFileGeneric`) — helper de descarga a
  reutilizar tal cual.
- `src/components/Admin/OrdersManager/Order/OrderPallets/hooks/useOrderPallets.ts` —
  `downloadPalletExpeditionLabel`/`canPrintExpeditionLabels` — patrón exacto de botón de descarga
  por ítem + gating de rol `comercial` a replicar.
- `src/hooks/orders/useOrderDocuments.ts` (`COMMERCIAL_RESTRICTED_DOCUMENT_NAMES`,
  `isCommercialSession`) — referencia del patrón de bloqueo por rol para documentos PDF, aunque
  este GAP no toca ese archivo.

## Criterios de aceptación

- [ ] Cada contenedor en `MaritimeContainersList.tsx` tiene un botón propio "Descargar Export
      Packing List".
- [ ] El botón está deshabilitado (con indicación visual de por qué) si el contenedor no tiene
      palets asignados.
- [ ] Descargar el PDF de un contenedor con palets asignados funciona (descarga directa,
      `Content-Disposition: attachment`).
- [ ] El botón no aparece para rol `comercial`.
- [ ] Un error de descarga (403, 500, etc.) muestra `notify.error` con el mensaje del backend, sin
      romper el resto de la pestaña.
- [ ] Este GAP no modifica `useOrderDocuments.ts` ni el flujo de envío de documentos por email.
- [ ] `npm run type-check` y `npm run lint` limpios.
- [ ] Funciona en mobile y desktop.

## Archivos a crear o modificar

**Modificar:**
- `src/services/domain/orders/orderMaritimeContainerService.ts` (o el service equivalente creado
  en GAP-128, a confirmar en implementación)
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx`

## Restricciones

- No tocar `src/hooks/orders/useOrderDocuments.ts` ni `OrderExport/index.tsx` — este documento
  queda fuera del flujo de envío por email, decisión ya tomada por el backend.
- No implementar envío por email de este documento en esta entrega.
- No crear archivos `.js` nuevos.
- No bloquear el botón de descarga cuando `palletIds` es `null` (relación no cargada) — solo
  bloquear cuando se confirma que el array está vacío.

---

## Implementación

### Archivos modificados

- `src/services/domain/orders/orderMaritimeContainerService.ts` — añadido
  `downloadExportPackingList(orderId, containerId, fileName)`, calco exacto del ejemplo del GAP,
  reutilizando `downloadFileGeneric` (`@/services/generic/entityService`).
- `src/components/Admin/OrdersManager/Order/OrderMaritimeExport/MaritimeContainersList.tsx`:
  - `useSession` + `canDownloadPackingList = !roles.includes('comercial')` (mismo patrón exacto
    que `canPrintExpeditionLabels` en `useOrderPallets.ts`).
  - Estado `downloadingContainerId` (por-contenedor, no global) para disabled+spinner solo en el
    botón que está descargando.
  - `handleDownloadPackingList(container)` — llama al service, `notify.error` con
    `getErrorMessage` en fallo (reexportado desde el propio `orderMaritimeContainerService.ts`,
    igual que ya hace `useOrderMaritimeContainers.ts`).
  - Botón "Descargar Export Packing List" (icono `BsFileEarmarkPdf`, mismo icono que
    `OrderExport/index.tsx` usa para PDFs) en la fila de acciones de cada contenedor, **fuera**
    del bloque `!readOnly` (la descarga no es una acción de edición, se mantiene visible en modo
    solo lectura — solo se oculta por rol `comercial`), con `disabled` cuando
    `container.palletIds?.length === 0` y `title` explicando por qué.

### Decisiones tomadas durante la implementación

- El botón de descarga se colocó **fuera** del condicional `!readOnly` que envuelve
  editar/eliminar, ya que descargar un documento no es una acción de mutación — un usuario en
  modo solo lectura (p. ej. Comercial en otros contextos, o cualquier `readOnly` futuro) debería
  poder seguir descargando el PDF si su rol lo permite. El único gating real es
  `canDownloadPackingList` (rol `comercial` excluido), no `readOnly`.
- Error handling: `downloadFileGeneric` lanza un objeto `detailedError` (no una instancia de
  `Error`/`ApiError`) cuyo campo `.message` ya es el mensaje amigable resuelto internamente
  (prioriza `userMessage` del backend) — `getErrorMessage(error as Record<string, unknown>)`
  sobre ese objeto capturado devuelve directamente ese mensaje ya resuelto, sin necesitar
  `instanceof ApiError` ni desempaquetar `.data` manualmente.
- Nombre de archivo: `Export-Packing-List-{containerNumber}` (sin extensión ni timestamp —
  `downloadFileGeneric` ya añade `__{fecha}__{hora}.pdf` automáticamente).

### Desviaciones del plan

Ninguna — coincide exactamente con la Solución acordada del GAP.

### Verificación

- `npm run type-check` → limpio (0 errores) en todo el proyecto.
- `npm run lint` → 0 errores, sin warnings nuevos en los 2 archivos tocados.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — implementación exacta a la Solución acordada, sin desviaciones no
documentadas, con las dos decisiones de diseño (independencia de `readOnly`, manejo del objeto
`detailedError` de `downloadFileGeneric`) correctamente razonadas y verificadas contra el código
real, no solo contra lo declarado.

### Checklist

Criterios de aceptación del GAP:

- [x] Cada contenedor tiene su propio botón "Descargar Export Packing List" — CUMPLIDO (icono
      `BsFileEarmarkPdf`, `aria-label` con el número de contenedor).
- [x] Botón deshabilitado con indicación visual si el contenedor no tiene palets — CUMPLIDO:
      `disabled={container.palletIds?.length === 0 || downloadingContainerId === container.id}`
      + `title` explicativo. Verificado explícitamente que `undefined === 0` es `false`, por lo
      que un `palletIds` `null`/`undefined` (relación no cargada) **no** bloquea el botón —
      cumple la restricción explícita del GAP, a diferencia de una implementación ingenua con
      `!container.palletIds?.length` que sí lo habría bloqueado incorrectamente.
- [x] Descarga funciona vía `downloadFileGeneric` con la URL exacta especificada en el GAP —
      CUMPLIDO, calco literal del snippet del GAP en `orderMaritimeContainerService.ts`.
- [x] Botón oculto (no solo deshabilitado) para rol `comercial` — CUMPLIDO:
      `canDownloadPackingList = !roles.includes('comercial')`, idéntico carácter por carácter al
      patrón de `canPrintExpeditionLabels` en `useOrderPallets.ts:76`, envolviendo el botón en
      `{canDownloadPackingList && (...)}` (no un `disabled`).
- [x] Error de descarga muestra `notify.error` con mensaje del backend sin romper la pestaña —
      CUMPLIDO y verificado contra `downloadFileGeneric` (`entityService.ts`): en el camino de
      error HTTP, el objeto lanzado (`detailedError`) no es una instancia de `Error`/`ApiError`,
      pero sí tiene un campo `.message` ya resuelto con prioridad `userMessage > message > error`
      (la propia función interna ya llama a `getErrorMessage(errorData)` antes de construir
      `detailedError.message`). Al volver a pasar ese objeto por
      `getErrorMessage(error as Record<string, unknown>)` en el componente, el resultado es
      `detailedError.userMessage (undefined) || detailedError.message (ya resuelto) || ...` →
      el mensaje correcto se propaga igual. La decisión documentada en el GAP de no necesitar
      `instanceof ApiError` es correcta.
- [x] No se modifica `useOrderDocuments.ts` ni `OrderExport/index.tsx` — CONFIRMADO con
      `git diff --stat`: ninguno de los dos aparece en el diff. (El diff sí incluye varios
      archivos de `OrderPallets/*` y `types/orders.ts`, pero corresponden al GAP-128, ya cerrado
      y aún sin commitear — no forman parte del diff real de este GAP. El diff aislado de los 2
      archivos declarados, revisado línea a línea, contiene únicamente lo descrito en la
      Solución acordada.)
- [x] `npm run type-check` y `npm run lint` limpios — verificado de forma independiente (no solo
      confiando en lo declarado): `type-check` → 0 errores; `lint` → 0 errores/267 warnings
      preexistentes, ninguno en los 2 archivos tocados (grep específico sin resultados).
- [x] Funciona en mobile y desktop — CONFIRMADO por inspección: la lista de contenedores (con el
      nuevo botón) se renderiza en una única rama compartida mobile/desktop; solo el diálogo de
      crear/editar ramifica por `isMobile`, tal como anticipaba el UI Brief.

Checklist técnico del proyecto:

- [x] Sin `fetch()` directo en código nuevo
- [x] Sin hardcode de tenant o header `X-Tenant`
- [x] Sin archivos `.js` nuevos creados
- [x] Sin `any` en TypeScript sin comentario justificativo (el único cast es
      `error as Record<string, unknown>`, consistente con el resto del proyecto para interoperar
      con `getErrorMessage` de `apiHelpers.js`, no tipado)
- [x] `useLabelEditor.ts` no tocado
- [x] `entitiesConfig.js` no tocado
- [x] Reglas de `.claude/rules/` respetadas (service, componente, manejo de errores)
- [x] Nomenclatura correcta (`downloadExportPackingList`, `handleDownloadPackingList`,
      `canDownloadPackingList`, `downloadingContainerId`)
- [x] Sin queryKeys nuevas necesarias (no es una query, es una descarga de archivo — no aplica)
- [x] Loading state con `Loader2` + disabled por-contenedor (no global), patrón exacto de
      `downloadPalletExpeditionLabel`
- [x] Errores con `notify.error(getErrorMessage(...))`
- [x] No aplica 422/`setErrorsFrom422` (no es un formulario)

### Decisión sobre `readOnly` independiente de la descarga (punto 4 de la auditoría solicitada)

Verificado el único consumidor real de `readOnly=true` en todo el proyecto:
`ComercialOrderDetailClient.tsx:12` — `<Order orderId={orderId} readOnly canViewCostData={false} />`,
usado exclusivamente en la vista de detalle de pedido para el rol `comercial`. No existe hoy
ningún otro punto de entrada que active `readOnly=true` para un rol distinto de `comercial` (ni
por estado del pedido, ni por otra vista). Por tanto, la decisión de desacoplar la descarga de
`readOnly` no abre ninguna brecha de permisos real: el único caso donde `readOnly` es `true`
coincide exactamente con el único caso donde `canDownloadPackingList` ya lo bloquea por rol. Si en
el futuro se introduce un `readOnly=true` para otro rol (p. ej. pedido cerrado/archivado visto por
un administrador), valdría la pena revisar si la descarga debería seguir siendo posible — pero
eso es un escenario hipotético fuera del alcance de este GAP, no un defecto de la implementación
actual.

### Revisión Visual

No aplica revisión visual completa — es un botón `ghost`/`icon` que reutiliza exactamente el
mismo slot y estilo (`variant="ghost" size="icon"`) que los botones de editar/eliminar ya
presentes en la misma fila, sin colores, tipografía ni layout nuevos. Icono (`BsFileEarmarkPdf`)
consistente con el uso ya existente en `OrderExport/index.tsx:174` para documentos PDF. Sin
`style={{}}` inline, sin colores hardcodeados.

### Revisión UX — LIGHT

```
UX REVIEW — LIGHT
═════════════════
GAP: GAP-129 — Descarga PDF Export Packing List por contenedor
Mode: Light (botón añadido a una fila ya existente, sin flujo nuevo)

[x] El cambio es autoexplicativo — icono PDF + aria-label con el número de contenedor
[x] No introduce una decisión nueva del usuario — un solo click, sin diálogo intermedio
[x] Consistente con la UI circundante — mismo slot/estilo que editar/eliminar
[x] Interactivo: hereda hover/focus/active del componente Button (ghost/icon) sin overrides
[x] Tono del texto coincide: "Descargar Export Packing List" / tooltip de bloqueo en el mismo
    registro que el resto de textos de ayuda del proyecto

VERDICT: ✅ APROBADO
```

Calificación como Light confirmada: no introduce flujo multi-paso, no toca una entidad primaria
más allá de añadir una acción de solo-lectura, no es un formulario/modal/wizard, no toca
navegación ni permisos por rol (reutiliza el patrón ya existente sin crear uno nuevo). El único
elemento con algo de complejidad (el manejo de `detailedError`) es un detalle técnico ya cubierto
en el checklist técnico, no un problema de flujo de usuario que requiera simulación completa.

### PL CANDIDATE

Ninguno — todo lo encontrado ya está cubierto por los checklists existentes y por el patrón de
referencia (`useOrderPallets.ts`) que el propio GAP señalaba.

### Estado final de la implementación

`orderMaritimeContainerService.downloadExportPackingList` añade un método de descarga directa,
calco literal del snippet del GAP, reutilizando `downloadFileGeneric`. `MaritimeContainersList.tsx`
añade un botón de descarga por contenedor con gating de rol (`comercial` excluido, oculto no solo
deshabilitado), estado de descarga por-contenedor con `Loader2`, deshabilitado solo cuando
`palletIds` es explícitamente un array vacío (nunca cuando es `null`/`undefined`), y manejo de
errores con `notify.error(getErrorMessage(...))` sobre el objeto `detailedError` no estándar que
lanza `downloadFileGeneric`. Cierra la serie completa de 5 GAPs (GAP-125 a GAP-129) de soporte a
Export Packing List de exportación marítima.
