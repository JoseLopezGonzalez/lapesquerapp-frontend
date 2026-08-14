---
title: Portal de Maquila — Guía Frontend (índice)
description: Referencia viva para implementar el portal del cliente de maquila (ExternalUser con toll_client_id) en el frontend Next.js.
updated: 2026-08-13
audience: Frontend Engineers
---

# Portal de Maquila — Guía Frontend

## Qué es esto y qué no es

Esta carpeta es la referencia de **consumo** para implementar el frontend del portal del cliente de
maquila. No sustituye a [`docs/maquila/00-especificacion-completa-maquila.md`](../00-especificacion-completa-maquila.md)
(el documento maestro), que sigue siendo la fuente única de verdad del **diseño y las decisiones de
negocio** (por qué se decidió cada cosa, historial de correcciones de auditoría, terminología
`TollClient` vs `ExternalProcessor`, etc.). Esta carpeta traduce ese diseño a algo consumible
pantalla por pantalla: qué endpoint llamar, qué shape esperar, qué reglas de permiso aplican, qué
está implementado hoy y qué no.

**Es documentación viva.** A medida que el frontend se implemente y se pruebe de verdad, aparecerán
discrepancias — campos que el backend no manda y hacen falta, campos que sobran y no se usan,
comportamientos que no son como se documentó aquí. Todo eso se registra en
[`99-pendientes-y-gaps.md`](./99-pendientes-y-gaps.md) y se corrige en el archivo de la pantalla
correspondiente — no se crean documentos nuevos dispersos, se edita esto.

**Regla de oro (CLAUDE.md §19.6):** si un endpoint está marcado ❌ o 🔶 más abajo, su shape de
respuesta es una **propuesta**, no un contrato — no está generado desde código real todavía. Los
endpoints marcados ✅ sí están verificados contra el código real (Resources/Policies/Controllers
leídos directamente, 2026-08-13) — aun así, antes de generar tipos TypeScript definitivos, confirma
contra `public/openapi/frontend.yaml` si el endpoint ya está incluido en el contrato público (ver
§4 más abajo).

## 1. Modelo de actor y sesión

El portal de maquila **no es un login separado**. Reutiliza el mismo flujo de autenticación que el
resto de la app (`POST /api/v2/auth/request-access` → magic link/OTP → `POST /api/v2/auth/otp/verify`
o `/magic-link/verify` → `GET /api/v2/me`). Si necesitas el detalle completo del flujo de auth
genérico para `ExternalUser` (payloads exactos de OTP/magic-link, manejo de 401/403, logout), está
ya documentado en [`docs/instrucciones/external-users-frontend-guide.md`](../../instrucciones/external-users-frontend-guide.md)
§4-§5 — no se repite aquí. Esta sección solo cubre **lo específico de maquila** encima de ese flujo
genérico.

### 1.1 Campo discriminador: `tollClientId`

El payload de sesión (`POST /auth/otp/verify`, `POST /auth/magic-link/verify`, `GET /api/v2/me`)
incluye, verificado en `AuthController::buildActorPayload()`:

```json
{
  "id": 42,
  "name": "María López",
  "email": "maria@clientemaquila.com",
  "assignedStoreId": null,
  "active": true,
  "role": null,
  "actorType": "external_user",
  "externalUserType": "maquilador",
  "tollClientId": 7,
  "tollClientName": "Conservas del Norte S.L.",
  "allowedStoreIds": [],
  "created_at": "...",
  "updated_at": "...",
  "features": []
}
```

**Regla de decisión para el frontend:**

```ts
if (session.actorType === 'external_user' && session.tollClientId !== null) {
  renderMaquilaPortal(); // el circuito de esta carpeta
} else if (session.actorType === 'external_user') {
  renderGenericExternalUserExperience(); // ver external-users-frontend-guide.md — A.21 genérico
} else {
  renderInternalApp();
}
```

⚠️ **No uses `externalUserType` para decidir esto.** Es un ENUM con un único valor legal
(`"maquilador"`), compartido por cualquier `ExternalUser`, tenga o no `toll_client_id` vinculado —
no distingue "cliente de maquila real" de "usuario externo genérico sin vincular". El único campo
fiable es `tollClientId !== null` (fail-closed, mismo criterio que usa el backend en cada controller
del portal vía `getCurrentTollClientId()`).

### 1.2 Branding (pantalla de login, antes de autenticar)

Endpoint público, sin sesión, requiere header `X-Tenant`:

```
GET /api/v2/toll-clients/branding/{slug}
```

Respuesta (200):

```json
{
  "data": {
    "name": "Conservas del Norte S.L.",
    "loginBannerUrl": "https://.../login-banner.jpg",
    "logoUrl": "https://.../logo.png"
  }
}
```

404 si el `slug` no existe o el cliente está inactivo (nunca 403 — no debe revelar existencia).
Ambas URLs pueden ser `null` si el cliente no tiene imágenes subidas todavía — el frontend debe
tener un fallback neutro (branding genérico del tenant/app).

**De dónde sale el `slug`:** hoy no hay forma de resolverlo desde el frontend antes de que el
usuario lo sepa — se espera que cada cliente de maquila acceda a una URL propia
(`/portal/{slug}/login` o similar, a definir en el enrutado del frontend) que el tenant le
proporciona. No existe endpoint de "buscar slug por email" — si se necesita, es un hueco a registrar
en `99-pendientes-y-gaps.md`, no a inventar aquí.

### 1.3 Actor equivocado / sin `toll_client_id`

Cualquier endpoint bajo `/api/v2/maquila/*` responde **403** con
`No tienes una identidad de cliente de maquila activa para acceder a este recurso.` si el actor es
un `User` interno, o un `ExternalUser` sin `toll_client_id` vinculado (usuario externo genérico de
A.21). El frontend debe tratar esto igual que cualquier 403 de permisos — no es un caso especial,
pero si tu router intenta precargar datos del portal antes de confirmar `tollClientId !== null` en
sesión, verás este 403 en vez de un error de ruteo más claro.

## 2. Convenciones generales del portal

- **Base path**: todo lo específico del portal cuelga de `/api/v2/maquila/*`. Algunas piezas
  compartidas con el resto de la app (palets, adjuntos, devoluciones, incidencia de pedido) cuelgan
  de sus rutas normales (`/api/v2/pallets`, `/api/v2/orders/{id}/incident`, etc.) porque ya están
  scopeadas para `ExternalUser` mediante el mismo mecanismo de propiedad — no las dupliques bajo
  `/maquila/*`.
- **Paginación**: estándar Laravel (`{ data, links, meta }`), parámetro `perPage`, tope 100 — igual
  que el resto de la API v2 (ver `docs/frontend/api-conventions.md`).
- **Errores**: formato unificado `{ message, userMessage, errors? }` — igual que el resto de la API.
- **Todo es de solo lectura salvo:** creación/edición de cabecera de `Order` propio (§4 de esta
  carpeta). Ninguna otra pantalla del portal permite escritura al cliente de maquila — cualquier
  intento de `POST`/`PUT`/`DELETE` fuera de eso debe esperar 403 o 404 a nivel de ruta, no un error
  de validación (el backend ni siquiera evalúa Policy en esos casos, no hay ruta).
- **Coste y margen internos nunca son del cliente de maquila** — con una única excepción confirmada
  el 2026-08-13: el cargo que le facturamos por el propio servicio de maquila (`MaquilaServiceCharge`,
  §6) sí es su dato. El precio/coste/margen de la venta a **sus propios clientes finales** (dentro
  de `Order`) nunca lo es — ver el hallazgo real en §4 y en `99-pendientes-y-gaps.md`: hoy el
  backend no cumple esto todavía en el detalle de pedido.

## 3. Estado de cada pieza (2026-08-13)

| Pantalla                                      | Archivo                                                    | Estado backend                                                       |
| --------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| Login / branding                              | (ver §1 arriba, no tiene archivo propio)                   | ✅ Implementado                                                      |
| Dashboard                                     | [`01-dashboard.md`](./01-dashboard.md)                     | ❌ No implementado — ningún endpoint existe todavía                  |
| Almacén interactivo (palets)                  | [`02-almacen-interactivo.md`](./02-almacen-interactivo.md) | ✅ Implementado                                                      |
| Producciones — listado                        | [`03-producciones.md`](./03-producciones.md)               | 🔶 Implementado sin filtros                                          |
| Producciones — panel interactivo              | [`03-producciones.md`](./03-producciones.md)               | ❌ No implementado                                                   |
| Producciones — detalle/trazabilidad/adjuntos  | [`03-producciones.md`](./03-producciones.md)               | ✅ Implementado                                                      |
| Pedidos — listado/detalle/crear/editar        | [`04-pedidos.md`](./04-pedidos.md)                         | 🔶 Implementado, con un hallazgo real de precios sin recortar (§4.5) |
| Incidencia de pedido (lectura)                | [`04-pedidos.md`](./04-pedidos.md)                         | ✅ Implementado                                                      |
| Envío de documentación (lo dispara el tenant) | [`04-pedidos.md`](./04-pedidos.md)                         | ✅ Implementado (no es una acción del portal)                        |
| Recepciones — listado/detalle/adjuntos        | [`05-recepciones.md`](./05-recepciones.md)                 | ✅ Implementado                                                      |
| Cargo de servicio de maquila (lectura)        | [`06-service-charges.md`](./06-service-charges.md)         | ❌ No implementado — Policy no acepta `ExternalUser` todavía         |
| Devoluciones (`TollClientReturn`, lectura)    | [`07-devoluciones.md`](./07-devoluciones.md)               | ✅ Implementado                                                      |

## 4. Contrato OpenAPI vs. esta guía

Para lo ya implementado (✅), la fuente de verdad definitiva del shape exacto sigue siendo
`public/openapi/frontend.yaml` (CLAUDE.md §19) — genera tipos desde ahí cuando sea posible. Esta
guía documenta lo mismo en prosa con ejemplos concretos porque el contrato OpenAPI no explica
**reglas de negocio ni ramas alternativas** (qué pasa si intentas X, qué campos están recortados y
por qué) — para eso sirve esta carpeta. Para lo no implementado (❌/🔶), no hay contrato todavía;
estos archivos son la especificación a implementar, no una referencia de algo ya construido.

## 5. Cómo mantener esto vivo

Cuando implementes una pantalla del frontend y descubras que la realidad no coincide con lo
documentado aquí:

1. Si el backend puede adaptarse sin romper una decisión de negocio ya tomada → dilo, se corrige el
   backend y se actualiza el archivo de la pantalla correspondiente en el mismo cambio.
2. Si lo que pide el frontend contradice una decisión de negocio ya confirmada (ver el documento
   maestro) → se registra en `99-pendientes-y-gaps.md` para decidir explícitamente, no se cambia en
   silencio.
3. Cualquier campo que el frontend termine sin usar, o que falte y haya que añadir, se anota en
   `99-pendientes-y-gaps.md` con la fecha — es el changelog de la brecha entre "lo documentado" y
   "lo que realmente hizo falta".
