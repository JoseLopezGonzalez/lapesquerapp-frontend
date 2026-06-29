# GAP-029 — Migrar useOrderDocuments al service layer (PL-001)

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-28
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/orders/useOrderDocuments.ts` llama a `fetchWithTenant` directamente **4 veces**,
violando la regla PL-001 (la capa de servicios es obligatoria para toda HTTP):

| Línea | Función | Verbo | Payload |
|-------|---------|-------|---------|
| 229 | `exportDocument` / `doExport` | GET | blob binario (PDF/XLSX/XLS) |
| 282 | `sendCustomDocuments` | POST | JSON custom |
| 312 | `sendMaquiladorDocuments` | POST | sin body |
| 334 | `sendStandarDocuments` | POST | sin body |

Adicionalmente:
- Path alias incorrecto: `@lib/fetchWithTenant` (línea 3) en lugar de `@/lib/fetchWithTenant`.
- Token extraído del `session` prop y pasado manualmente a headers (PL-NEW-C).
- `Authorization` hardcodeado en cada llamada `fetchWithTenant`.

El propio archivo tiene un comentario reconociendo la deuda:
> *"Candidato a refactorizar a downloadFileGeneric en un GAP futuro."*

`downloadFileGeneric` ya existe en `src/services/generic/entityService.ts` y gestiona
blobs, nombre de archivo y `getAuthToken()` internamente (token opcional, nunca requerido
como parámetro).

El hook tiene lógica de **visibilidad de rol** legítima (`isCommercialSession`) que
**debe permanecer** en el hook — solo las llamadas HTTP se mueven al service.

## Solución acordada

1. Crear `src/services/domain/orders/orderDocumentService.ts` con:

   ```ts
   export const orderDocumentService = {
     async downloadDocument(
       orderId: number | string,
       documentName: string,
       type: string,
       fileName: string
     ): Promise<boolean>
     // usa downloadFileGeneric — sin token como parámetro

     async sendCustomDocuments(
       orderId: number | string,
       json: unknown
     ): Promise<unknown>
     // usa performActionGeneric o createEntityGeneric

     async sendMaquiladorDocuments(
       orderId: number | string
     ): Promise<unknown>

     async sendStandardDocuments(
       orderId: number | string
     ): Promise<unknown>
   };
   ```

   La función `getOrderExportUrl` y la constante `COMMERCIAL_RESTRICTED_DOCUMENT_NAMES`
   se mueven al service (son lógica de construcción de URL y listado de documentos).
   Los arrays `exportDocuments` y `fastExportDocuments` también se mueven al service.

2. Actualizar `useOrderDocuments.ts`:
   - Eliminar import de `fetchWithTenant`
   - Corregir path alias si queda alguno (aunque ya no debería quedar import de `fetchWithTenant`)
   - Importar `orderDocumentService` desde el service nuevo
   - Reemplazar los 4 bloques de `fetchWithTenant` por llamadas al service
   - El hook conserva: `session` (solo para `isCommercialSession`), `notify`, lógica de UI
   - El hook NO conserva: extracción de token, headers HTTP, construcción de URL

## Referencias e inspiración

- PL-001 / PL-NEW-C (project-learnings.md)
- `src/services/generic/entityService.ts:63` — `downloadFileGeneric` con token interno
- `src/services/domain/orders/orderAttachmentService.ts` — servicio de adjuntos en misma carpeta
- El propio comentario en línea 10-11 del hook documenta este GAP

## Criterios de aceptación

- [ ] Existe `src/services/domain/orders/orderDocumentService.ts` con las 4 operaciones
- [ ] `downloadDocument` en el service usa `downloadFileGeneric` — sin token como parámetro
- [ ] `sendCustomDocuments`, `sendMaquiladorDocuments`, `sendStandardDocuments` usan `getAuthToken()` internamente o helpers genéricos (no reciben token como parámetro)
- [ ] `useOrderDocuments.ts` no importa `fetchWithTenant`
- [ ] `useOrderDocuments.ts` no extrae ni usa `session?.user?.accessToken` para HTTP
- [ ] `useOrderDocuments.ts` sigue usando `session` solo para `isCommercialSession(session)` (rol)
- [ ] La interfaz pública `UseOrderDocumentsResult` no cambia
- [ ] El prop `session: Session | null` se mantiene en `UseOrderDocumentsParams` (necesario para rol)
- [ ] La descarga de archivos (PDF/XLSX/XLS) funciona correctamente
- [ ] `npm run build` pasa sin errores

## Archivos a crear o modificar

**Crear:**
- `src/services/domain/orders/orderDocumentService.ts`

**Modificar:**
- `src/hooks/orders/useOrderDocuments.ts` — eliminar fetchWithTenant directo, usar service

## Restricciones

- No cambiar la interfaz pública del hook (`UseOrderDocumentsParams`, `UseOrderDocumentsResult`)
- `isCommercialSession` y la lógica de visibilidad de documentos por rol permanecen en el hook
- No tocar `src/hooks/useOrder.js` (hook gigante protegido)
- No añadir tests en este GAP
- La lógica de blob download (createObjectURL, click, revokeObjectURL) ya está manejada
  por `downloadFileGeneric` — no reimplementar en el service

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
