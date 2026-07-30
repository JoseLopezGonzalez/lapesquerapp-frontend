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
