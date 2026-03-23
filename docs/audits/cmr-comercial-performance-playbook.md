# CMR Comercial Performance Playbook

Este documento consolida los hallazgos y cambios aplicados durante la auditoria de rendimiento del bloque CMR/comercial (prospectos, clientes, ofertas, agenda y rutas). Sirve como checklist reutilizable para revisar otros apartados con los mismos criterios.

## 1) Sintomas base detectados

- Lentitud general al navegar por vistas CRM/comercial.
- Ráfagas de requests tras abrir detalles o guardar cambios.
- Sobre-consulta por carga de tabs no visibles.
- Refetch en cascada por invalidaciones demasiado amplias.

## 2) Causas raiz observadas (patrones)

### 2.1 Sesion consultada por request CRM y servicios adyacentes

- `crmService` pedía sesion para cada llamada de red.
- Efecto: por cada endpoint CRM podía existir coste adicional de auth.
- Adicionalmente, coexistían caminos con cache distinto (`crmService`) y sin cache (`getAuthToken` en catálogos como `countries`), provocando doble consulta de sesion en un mismo flujo (abrir editar -> cargar países -> guardar).

Patron corregido:
- Cache de token compartido en `getAuthToken` para todo el frontend.
- Expiración por `exp` real del JWT (no solo TTL fijo).
- Deduplicación de promesa en vuelo para evitar carreras de auth.
- Reset de cache en 401.

Archivo clave:
- `src/services/crmService.ts`
- `src/lib/auth/getAuthToken.ts`
- `src/services/domain/countries/countryService.ts`

### 2.2 Carga eager de datos de tabs

- Abrir un detalle disparaba varias queries en paralelo aunque el usuario no abriera esas secciones.
- Ejemplos típicos:
  - detalle con `contacts`, `interactions`, `offers` cargados a la vez.

Patron corregido:
- Lazy-load por tab con `enabled` condicional por `activeTab`.

Archivos clave:
- `src/components/Comercial/CRM/ProspectDetail.jsx`
- `src/components/Comercial/CRM/CustomersPageClient.jsx`
- `src/hooks/useProspects.ts` (enabled en `useProspectContacts`)
- `src/hooks/useCommercialInteractions.ts` (enabled soportado)
- `src/hooks/useOffers.ts` (ya soportaba enabled en lista)

### 2.3 Estado de tab heredado entre entidades

- Cambiar de prospecto/cliente podía mantener la tab previa.
- Efecto: fetch no esperado (porque entraba directo en tab secundaria).

Patron corregido:
- Reset de `activeTab` a `data` al cambiar `prospectId`/`customerId`.
- Limpieza de estado UI derivado (modales/draft relevantes).

Archivos clave:
- `src/components/Comercial/CRM/ProspectDetail.jsx`
- `src/components/Comercial/CRM/CustomersPageClient.jsx`

### 2.4 Invalidaciones globales tras mutaciones

- Mutaciones invalidaban demasiadas familias de query (`dashboard`, `agenda`, `summary`, `list`, `detail`, etc).
- Efecto: refetch en cascada.

Patron corregido:
- Invalidaciones parametrizadas por impacto real.
- Recorte de queries no relacionadas.

Archivos clave:
- `src/hooks/useProspects.ts`
- `src/hooks/useOffers.ts`
- `src/hooks/useAgenda.ts`
- `src/hooks/useCommercialInteractions.ts`

### 2.5 Mutaciones que refetcheaban lo que ya se podia mutar localmente

- Caso clave: contactos de prospecto.
- Aunque había patch local, seguía habiendo reconsulta de seguridad posterior.

Patron corregido:
- `onMutate` optimista + `onSuccess` reconciliación + `onError` rollback.
- Sin refetch automático para los endpoints ya cubiertos por cache local.

Archivo clave:
- `src/hooks/useProspects.ts` (`createContact`, `updateContact`, `deleteContact`)

### 2.6 Busqueda sin debounce

- Filtro de ofertas pegaba requests por pulsación.

Patron corregido:
- Debounce del texto antes de consultar.

Archivo clave:
- `src/components/Comercial/CRM/OffersPageClient.jsx`

### 2.7 Formularios que cargaban catalogos estando cerrados

- `OfferFormSheet` montado pero cerrado seguía cargando opciones.

Patron corregido:
- Gating por `open` y `enabled`.

Archivos clave:
- `src/components/Comercial/CRM/OfferFormSheet.jsx`
- `src/hooks/useOrderFormOptions.js`
- `src/hooks/useProductOptions.js`
- `src/hooks/useTaxOptions.js`

### 2.8 Edición de prospecto con responsabilidades mezcladas

- El modal de edición incluía campos de contacto principal, aunque el mantenimiento de contactos ya existe en su sección dedicada.
- Efecto: UI redundante, mayor riesgo de inconsistencias y payloads innecesarios en update.

Patron corregido:
- En edición de prospecto, ocultar bloque de contacto principal.
- En update, no enviar `primaryContact` en payload.
- Mantener contacto principal solo en alta de prospecto.

Archivo clave:
- `src/components/Comercial/CRM/ProspectFormSheet.jsx`

### 2.9 Espacios en blanco por layout fijo en dialogs condicionales

- Al ocultar secciones condicionales (como contacto en edición), un `height` fijo mantenía huecos grandes en el modal.

Patron corregido:
- En modo edición usar altura adaptable (`max-height`) y reservar altura fija solo para escenarios con formulario largo (alta).

Archivo clave:
- `src/components/Comercial/CRM/ProspectFormSheet.jsx`

### 2.10 Creación de interacciones con refetch evitable

- Crear interacción desde prospecto/cliente puede provocar invalidaciones no relacionadas (por ejemplo, refrescar prospectos al crear desde cliente).
- Efecto: ráfagas de red y latencia visual evitable tras guardar.

Patron corregido:
- Invalidación condicional por target:
  - si hay `prospectId`, invalidar solo árboles de prospecto afectados.
  - si hay `customerId`, invalidar solo árboles de cliente afectados.
- En listas de interacciones, aplicar `onMutate` optimista + `onError` rollback + `onSuccess` reconciliación.
- Reservar refetch global para `dashboard/agenda` solo cuando su semántica realmente dependa del alta.

Archivo clave:
- `src/hooks/useCommercialInteractions.ts`

### 2.11 Agenda con invalidaciones y filtros que generan ráfagas

- Mutaciones de agenda (`reprogramar/cancelar`) con invalidaciones amplias generan refetch en dominios no relacionados.
- Filtros de agenda aplicados en cada toggle disparan requests encadenadas dentro del diálogo.

Patron corregido:
- En agenda, invalidación mínima por defecto: `agenda` y `agenda/summary`.
- En creación de interacción, evitar `onSettled` global cuando ya existe optimismo; invalidar condicionalmente en `onSuccess` según impacto real (p. ej. `agendaActionId`, `nextActionAt`).
- En filtros de agenda, usar estado borrador y aplicar cambios con acción explícita.

Archivos clave:
- `src/hooks/useAgenda.ts`
- `src/hooks/useCommercialInteractions.ts`
- `src/components/Comercial/CRM/AgendaPageClient.jsx`
- `src/components/Comercial/CRM/QuickInteractionModal.jsx`

## 3) Cambios aplicados en esta ronda

1. Token cache inicial en `crmService` con dedupe de sesión.
2. Lazy-load por tabs en detalle de prospecto y cliente.
3. Reset de tab a `data` al cambiar entidad.
4. Debounce en búsqueda de ofertas.
5. Gating de catálogos del modal de oferta con `enabled: open`.
6. Invalidaciones más finas en hooks CRM.
7. Cache local optimista para mutaciones de contactos en prospecto.
8. `updateProspect` migrado a patch local optimista (detalle + lista) con rollback.
9. Eliminación de refetch de seguridad en contactos tras guardado.
10. Unificación de cache de auth en `getAuthToken` (compartida por CRM y catálogos como countries).
11. Edición de prospecto sin bloque/payload de contacto principal.
12. Ajuste de altura del dialog en edición para eliminar huecos en blanco.
13. Creación de interacciones con invalidación dirigida por target y patch optimista de listas.
14. Agenda optimizada con invalidación mínima y filtros aplicados por borrador.

## 4) Checklist reutilizable para otros modulos

Aplicar este checklist al revisar cualquier pantalla:

1. **Carga inicial**
   - ¿Pide datos de tabs/paneles no visibles?
   - ¿Hay modales cerrados que disparan queries?

2. **Estado de navegación**
   - ¿Se resetea estado local al cambiar entidad (`id`)?
   - ¿Se arrastran tabs, drafts o modales entre entidades?

3. **Mutaciones**
   - ¿Hace invalidación global por defecto?
   - ¿Se puede reemplazar por patch local de cache?
   - ¿Existe rollback robusto en `onError`?

4. **Búsquedas y filtros**
   - ¿Hay debounce en inputs que consultan backend?
   - ¿El query key cambia por ruido (objetos inestables)?

5. **Autenticación y transporte**
   - ¿Se repite trabajo de auth por request?
   - ¿Todos los servicios usan la misma capa de cache de token?
   - ¿Hay deduplicación de requests simultáneas?

6. **Separación de responsabilidades del formulario**
   - ¿El formulario de edición incluye datos que pertenecen a otro módulo (p.ej. contactos)?
   - ¿Se envían campos no necesarios en payload de update?

7. **Validación**
   - Revisar network:
     - abrir detalle
     - cambiar de entidad
     - editar/guardar
     - usar buscador
   - Confirmar que no hay ráfagas de refetch no justificadas.

## 5) Señales de alerta (red flags)

- `invalidateQueries` sin scoping por entidad.
- `onSettled` con refetch completo después de `onMutate + onSuccess`.
- Hooks de catálogo sin `enabled`.
- Servicios con estrategias de auth distintas dentro del mismo flujo (doble `session`).
- Tabs en modo controlado sin reset por `id`.
- Búsqueda conectada directo al input sin debounce.
- Formularios de edición con secciones que no deben editarse en ese contexto.
- Mutaciones de interacciones que invalidan listas no relacionadas con el target (`prospect` vs `customer`).
- Refactor de `queryKey` sin actualizar todas las invalidaciones/mutaciones asociadas (riesgo de cache stale silenciosa).
- Mutaciones con `onSettled` + invalidación global después de una estrategia optimista local.
- Diálogos de filtros que escriben estado “live” en cada toggle (bursts de requests).

## 6) Criterio de diseño recomendado

- Preferir:
  - `onMutate` + `onSuccess` + `onError` para cambios locales frecuentes.
  - invalidación mínima y dirigida.
  - fetch on-demand por visibilidad real.
  - una única utilidad de token compartida por todos los servicios frontend.
- Usar refetch global solo cuando haya dependencia de lógica server-side no modelada en frontend.

## 7) Archivos de referencia principal

- `src/services/crmService.ts`
- `src/lib/auth/getAuthToken.ts`
- `src/hooks/useProspects.ts`
- `src/hooks/useOffers.ts`
- `src/hooks/useCommercialInteractions.ts`
- `src/hooks/useAgenda.ts`
- `src/components/Comercial/CRM/ProspectDetail.jsx`
- `src/components/Comercial/CRM/CustomersPageClient.jsx`
- `src/components/Comercial/CRM/OffersPageClient.jsx`
- `src/components/Comercial/CRM/OfferFormSheet.jsx`
- `src/hooks/useOrderFormOptions.js`
- `src/hooks/useProductOptions.js`
- `src/hooks/useTaxOptions.js`
- `src/components/Comercial/CRM/ProspectFormSheet.jsx`
- `src/services/domain/countries/countryService.ts`

