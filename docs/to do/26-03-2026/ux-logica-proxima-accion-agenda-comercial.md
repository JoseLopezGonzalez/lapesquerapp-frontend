# UX + lógica de "Próxima acción" (Agenda rol comercial)

Documento vivo para discusión y aterrizaje técnico del flujo UX de **Próxima acción / Acción pendiente** en el rol comercial.

> Para **contrato API / integración backend**, la sección **"Dependencias Backend"** es la referencia canónica y prevalece sobre secciones anteriores si hubiera discrepancias de naming o semántica.

**Última revisión de estado: 2026-03-26**

## Resumen ejecutivo de lógica de negocio (para validación)

> Este bloque resume solo la lógica de negocio acordada para que puedas confirmarla sin revisar todo el detalle técnico.

1. En cada target (prospecto o cliente) solo puede existir **una** acción pendiente activa a la vez (la “próxima acción”). ✅ confirmado
2. Registrar una interacción y gestionar la próxima acción se separa en **dos pasos**: primero se guarda la interacción, luego se resuelve la próxima acción. ✅ confirmado
3. El sistema debe permitir registrar interacción aunque haya conflictos de agenda; un error de agenda no debe impedir guardar la interacción. ✅ confirmado
4. Si el comercial decide “sobreescribir” la próxima acción, la acción pendiente anterior pasa a `cancelled` y se crea una nueva `pending` como activa. ✅ confirmado
5. Al sobrescribir se debe guardar motivo (predefinido por defecto y/o texto libre del usuario). ✅ confirmado
6. Si existe una acción pendiente vencida, no se puede ignorar implícitamente: el flujo obliga a decidir entre hacer, reprogramar, cancelar o mantener con decisión explícita. ✅ confirmado
7. “Mantener” no permite crear otra próxima acción en paralelo sin decisión explícita; para avanzar debe elegirse actualizar, reprogramar o sobrescribir. ✅ confirmado
8. El flujo de “Nueva interacción” desde agenda debe mostrar preflight cuando hay pendiente activa: retomar, continuar o ver detalle. ✅ confirmado
9. La entrada “Nueva interacción” vive en nivel agenda (diálogo del día y botón global), no dentro del panel de detalle de una acción concreta. ✅ confirmado
10. La fuente de verdad de próxima acción es `agenda_actions`; `prospects.next_action_*` queda como réplica temporal de compatibilidad. ✅ confirmado
11. El backend debe exponer una operación atómica para resolver la próxima acción (`keep/update/reschedule/override/create_if_none`) y evitar estados intermedios. ✅ confirmado
12. Si una interacción se guarda sin `agendaActionId`, la próxima acción solo se puede gestionar por el endpoint específico de resolución (sin atajos en el mismo POST). ✅ confirmado

### Aclaración simple de puntos pendientes (10 y 12)

**Punto 10 (fuente de verdad)**  
Queremos evitar que una pantalla diga una próxima acción y otra diga otra distinta.  
Por eso:

- `agenda_actions` manda siempre (allí está la pendiente real activa).
- `prospects.next_action_*` se mantiene solo como espejo temporal para no romper pantallas antiguas.

**Punto 12 (sin atajos en POST de interacción)**  
Si guardas una interacción sin `agendaActionId`, ese endpoint solo guarda la interacción.  
No debe crear/cambiar próxima acción ahí mismo.  
La próxima acción se resuelve después en el Paso 2 (`resolve-next-action`) para que la lógica sea consistente y no haya efectos mezclados.

**Qué significa exactamente `agendaActionId`**  
`agendaActionId` identifica **qué acción de agenda concreta se está cerrando** en el flujo de cierre (`done` o `completed_and_created`).  
No es un “permiso” para crear próxima acción en cualquier caso.  
Fuera del cierre explícito de una acción, la próxima acción se gestiona solo en Paso 2 (`resolve-next-action`).

---

## Estado de implementación

| Componente                                                               | Estado          | Notas                                                        |
| ------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------ |
| Fundación agenda: CRUD (crear/listar/cancelar/reprogramar)               | ✅ IMPLEMENTADO | `CrmAgendaService`, `CrmAgendaController`                    |
| `POST /commercial-interactions` (flujo actual acoplado)                  | ✅ IMPLEMENTADO | Guarda interacción + sync agenda en una sola transacción     |
| Reprogramación con cadena (`previous_action_id`)                         | ✅ IMPLEMENTADO | `CrmAgendaService::reschedule()`                             |
| Status `reprogrammed` en `agenda_actions`                                | ✅ IMPLEMENTADO | Migración `2026_03_19`                                       |
| Campos `source_interaction_id` y `previous_action_id`                    | ✅ IMPLEMENTADO | Modelo y migración `2026_03_18`                              |
| Campo `description` canónico en `agenda_actions`                         | ✅ IMPLEMENTADO | En fillable y `toArrayAssoc()`                               |
| `POST /commercial-interactions` — Paso 1 desacoplado ("siempre guardar") | ✅ IMPLEMENTADO | Interacción libre guardable cuando no llega `agendaActionId` |
| `agendaActionId` opcional en `StoreCommercialInteractionRequest`         | ✅ IMPLEMENTADO | Paso 1 admite ausencia de `agendaActionId`                   |
| Desacoplar interacción de agenda (transacción separada)                  | ✅ IMPLEMENTADO | Fallos de agenda no provocan rollback de interacción         |
| Endpoint `POST /crm/agenda/resolve-next-action` (Paso 2)                 | ✅ IMPLEMENTADO | Ruta + request + controlador + servicio                      |
| Estrategias `keep/update/reschedule/override/create_if_none`             | ✅ IMPLEMENTADO | Implementadas en `CrmAgendaService::resolveNextAction()`     |
| Campo `reason`/`cancel_reason` en `agenda_actions`                       | ✅ IMPLEMENTADO | Campo `reason` añadido en migración 2026-03-26               |
| Endpoint `GET /crm/agenda/pending` (preflight)                           | ✅ IMPLEMENTADO | Devuelve pending + `isOverdue`/`daysOverdue`                 |
| Códigos de error estables (`PENDING_EXISTS`, `STALE_PENDING`…)           | ✅ IMPLEMENTADO | Códigos de dominio + validación estandarizada                |
| Contrato de respuesta enriquecido (`previousPending`/`currentPending`)   | ✅ IMPLEMENTADO | Respuesta uniforme en `resolve-next-action`                  |

---

## Estado del plan backend (ejecutado)

Plan ejecutado en 3 bloques:

1. **Paso 1 desacoplado**: interacción libre guardable + fail-fast de campos de próxima acción fuera de flujo.
2. **Paso 2 implementado**: `resolve-next-action` con estrategias, respuesta uniforme y errores de dominio.
3. **Preflight implementado**: endpoint de pending activa con derivados de vencimiento.

---

## Contexto

En el CRM del rol comercial existe el concepto de **acción pendiente / próxima acción** que guía el seguimiento por target:

- Target = prospect (prospecto) o customer (cliente)
- Concepto: "siguiente compromiso real"

**Decisión base (cerrada D1):** Una sola próxima acción activa por target.

Esto implica que el sistema debe permitir:

- **Sobreescribir** la próxima acción existente (convertirla automáticamente en no-activa).
- **Modificar** (editar contenido) la próxima acción existente.
- **Reprogramar** (cambiar fecha) la próxima acción existente.

### Flujo ideal (lineal)

1. El comercial abre agenda y revisa pendientes.
2. Realiza la acción y registra una **interacción**.
3. Normalmente crea una **próxima acción**.
4. Si no puede hacerla, la **reprograma**.
5. Si decide descartarla, la **cancela**.

---

## Problema UX real (dilema)

Hay escenarios habituales donde el flujo lineal se rompe:

### Caso A — "Cambio de tornas" tras cerrar una acción

- El comercial cierra una acción y crea una siguiente.
- Poco después cambia el contexto (llamada entrante, etc.).
- Necesita registrar otra interacción y ajustar la próxima acción.
- Puede ocurrir que la acción anterior ya no sirva, o siga sirviendo junto con una nueva necesidad.

### Caso B — "Interacción inesperada" cuando la próxima acción no es hoy

- La próxima acción no era hoy.
- El target llama o hay una interacción imprevista.
- Dilema: registrar interacción + decidir qué pasa con la próxima acción existente.

---

## Estado actual del sistema

### 1) Modelado

El modelo está orientado a una sola próxima acción por target:

- `Prospect.nextActionAt` / `Prospect.nextActionNote` (legacy para prospectos)
- `CommercialInteraction.nextActionAt` / `CommercialInteraction.nextActionNote` (histórico por interacción)
- La agenda materializada vive en `agenda_actions` con `status`:
  - `pending`, `reprogrammed`, `done`, `cancelled`

Campos ya existentes en `agenda_actions` (migración `2026_03_18`):

- `target_type`, `target_id`, `scheduled_at`, `description`
- `status` (constraint: `pending|done|cancelled|reprogrammed`)
- `source_interaction_id` (FK a `commercial_interactions`, nullable)
- `completed_interaction_id` (FK a `commercial_interactions`, nullable)
- `previous_action_id` (FK self-referencial, para cadena reschedule/override)

**Estado DB actualizado:**

- Campo `reason` ya incorporado en `agenda_actions` (migración 2026-03-26).

### 2) Restricción 422 en creación desde interacción (contexto legacy)

Cuando se intenta registrar una interacción creando una próxima acción y ya existe una `pending` activa para ese target, el backend responde `422`:

> "Ya existe una acción pendiente activa para este target. Reprograma o cierra la pendiente actual antes de crear otra."

Este error viene de `CrmAgendaService::createPendingFromInteraction()` y sigue siendo esperado en el flujo legacy de crear próxima acción directamente desde interacción.

**Efecto UX esperado con el diseño actual:** cuando aparezca este conflicto, el frontend debe resolverlo mediante Paso 2 (`resolve-next-action`) sin forzar navegación manual fuera del flujo guiado.

### 3) Lo que permite hoy la Agenda ✅

- **Reprogramar** acción (`reschedule`) → crea cadena (`reprogrammed` + nueva `pending` con `previous_action_id`)
- **Cancelar** acción (`cancel`)
- **Marcar hecha** (cierre) ⇒ registra interacción y opcionalmente programa siguiente
- `getPendingForTarget()` interno (no expuesto como endpoint público)

### 4) Aclaración clave

El dilema original **no nace del flujo de "marcar hecha"**:

- Cuando marcas una acción como hecha, **consumes** la única `pending` activa y luego puedes crear la siguiente sin conflicto.

El dilema real aparece cuando el comercial:

- Registra una interacción **sin depender de una acción prevista** (llamada entrante, visita, etc.)
- Y además quiere crear o ajustar la próxima acción
- Existiendo ya una `pending` activa para ese target.

---

## Enfoque de producto: "Agenda primero"

Objetivo: la agenda es el **"centro de decisión"**, no un listado pasivo.

---

## Propuesta de UX en Agenda (flujo guiado)

### 1) Clic en una acción ⇒ abrir panel contextual (modal no-dismissable)

Al pulsar una acción:

- Dialog/panel que **no se cierra al pinchar fuera**.
- Contextualiza al comercial sobre el target.

**Contenido mínimo:**

- **Header**: nombre target, tipo, estado de la acción, fecha y nota.
- **Contexto rápido** (mini overview):
  - Timeline de últimas N interacciones.
  - Acceso a pedidos/histórico o resumen.
  - Acceso a ficha completa.

**Acciones claras:**

- **Hacer** (equivale a "marcar hecha" + registrar interacción)
- **Reprogramar**
- **Cancelar**

### 2) Registrar interacción desde Agenda (sin acción prevista)

La agenda debe permitir crear interacción + próxima acción **sin que la interacción cuelgue de una acción prevista**.

**Regla UX:** no mostrar "Nueva interacción" dentro del panel de detalle de una acción.

El CTA "Registrar interacción (sin cerrar ninguna tarea)" debe existir en:

- El **diálogo del día**, y/o
- La **agenda global** (botón flotante principal).

#### 2.1) Preflight al iniciar "Nueva interacción" (si existe pending activa)

Si existe `pending` activa para el target, avisar y ofrecer:

- **Retomar acción pendiente** (abrir panel / hacer / reprogramar / cancelar)
- **Continuar registrando interacción**
- (Opcional) **Ver detalle** en solo lectura

Objetivo: evitar que el comercial se "salte" una acción por descuido.

#### 2.2) Separar UI: "Registrar interacción" vs "Gestionar próxima acción"

Separar en 2 pasos claros:

- **Paso 1**: Registrar interacción (siempre guardable)
- **Paso 2**: Gestionar próxima acción (única)

En el Paso 2, si ya existe `pending`, permitir:

- **Editar** la pendiente actual (contenido)
- **Reprogramar** la pendiente actual (fecha)
- **Sobreescribir** con la nueva (la nueva pasa a ser activa; la anterior deja de serlo)
- **Mantener la anterior** (no se crea nueva próxima acción)

---

## Reglas lógicas

### Regla base

- **Siempre se puede registrar una interacción.**
- La agenda debe quedar consistente: **1 sola `pending` activa por target.**
- Si existe una pendiente vencida, antes de permitir "crear nueva próxima acción" el sistema debe forzar una elección explícita: hacer / reprogramar / cancelar / mantener.

### Micro-regla UX para el Paso 2

Si existe `pending` vencida, mostrar bloque fijo:

> "**Acción pendiente actual (vencida)**: fecha + nota"
> "Antes de programar una nueva próxima acción, decide qué hacemos con esta"
>
> - Hacer ahora (ligar interacción y cerrarla)
> - Reprogramar
> - Cancelar
> - Mantener

**Nota sobre "Mantener":** no permite "crear otra sin decidir". Mantener permite continuar solo si el usuario decide explícitamente: Sobreescribir, Editar, o Reprogramar la existente.

### Ejemplos para validar la lógica

#### Ejemplo 1 — Pendiente vencida y la interacción "es para cumplirla"

- Pendiente vencida: "Llamar para confirmar condiciones". Hoy ocurre la llamada.
- Resultado deseado: la interacción se liga a esa acción (→ "Hacer") + programar siguiente.

#### Ejemplo 2 — Pendiente vencida pero la interacción es "informativa"

- Pendiente vencida: "Enviar oferta". Hoy el cliente llama por un dato logístico.
- Resultado deseado: registrar interacción sin cerrar la pendiente; por defecto **mantener** la pendiente.

#### Ejemplo 3 — Pendiente vencida y la interacción cambia el plan

- Pendiente vencida: "Llamar el jueves". Hoy piden "visita mañana".
- Resultado deseado: registrar interacción → sugerir **sobreescribir** (la nueva pasa a activa, la anterior queda `cancelled` con motivo).

#### Ejemplo 4 — Pendiente futura y entra interacción inesperada

- Próxima acción para dentro de 5 días. Hoy llaman.
- Resultado deseado: registrar interacción → sobreescribir/reprogramar si afecta, mantener si no.

#### Ejemplo 5 — No existe pendiente activa

- Resultado deseado: registrar interacción + programar próxima acción sin fricción.

---

## Decisiones cerradas

| ID     | Decisión                                                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | **1 sola próxima acción activa** por target.                                                                                                               |
| **D2** | "Sobreescribir" = **cancelar** la anterior (`cancelled`) + crear nueva como única activa. Motivo: texto predefinido de la app y/o texto libre del usuario. |
| **D3** | El "panel contextual" se organiza con **tabs** (pestañas).                                                                                                 |
| **D4** | Pendiente vencida no se puede ignorar "sin decidir". "Mantener" permite continuar solo si se elige explícitamente Sobreescribir, Editar o Reprogramar.     |
| **D5** | El reemplazo/sobreescritura se implementa en **backend** (operación atómica).                                                                              |
| **D6** | CTA "Registrar interacción": **diálogo del día** + **botón flotante global**.                                                                              |
| **D7** | Flujo en **2 pasos siempre**: Interacción → Próxima acción.                                                                                                |
| **D8** | **Preflight siempre** que haya `pending` activa. Opciones: Retomar / Continuar / Ver detalle.                                                              |
| **D9** | Terminología: "Acción pendiente" = "próxima acción" = la única activa (`pending`) por target.                                                              |

**D10 (pendiente):** Definir si el panel contextual es copia adaptada de las vistas existentes de cliente/prospecto y qué recortes/añadidos.

---

## Dependencias Backend

Esta sección aterriza el contrato backend necesario para soportar el UX acordado sin workarounds en frontend.

### Fricciones originales (estado actual)

- **(A) Conflicto "ya existe pending"**: se mantiene como regla de dominio, pero el flujo actual ya dispone de resolución explícita en Paso 2 (`resolve-next-action`).
- **(B) Registro de interacción libre**: resuelto. Ya no se exige `agendaActionId` para guardar interacción en Paso 1.
- **(C) Transacción acoplada**: resuelto para el flujo desacoplado. Un fallo de agenda no debe impedir guardar interacción en Paso 1.

### Objetivos backend

1. **Guardar interacciones siempre** (sin depender de agenda).
2. Mantener la invariante: **1 sola `pending` activa por target.**
3. Operación **atómica** para sobreescribir próxima acción: cancelar anterior + crear nueva + guardar motivo.
4. Gestionar próxima acción en Paso 2: `keep|update|reschedule|override|create_if_none`.
5. Endpoint de **preflight**: `pending` actual de un target + `isOverdue`/`daysOverdue`.

### Convención de nombres

| Contexto                                        | Campo de texto   | Notas                                                                                               |
| ----------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `POST /commercial-interactions` (Paso 1)        | `nextActionNote` | Legacy; el backend mapea a `agenda_actions.description`. No exponer `description` en este endpoint. |
| `POST /crm/agenda/resolve-next-action` (Paso 2) | `description`    | 1:1 con el modelo `AgendaAction`.                                                                   |
| Tabla `agenda_actions` (backend)                | `description`    | Nombre canónico.                                                                                    |

### Gobierno de dato (fuente de verdad)

- **Fuente de verdad**: `agenda_actions` (única `pending` por target).
- **Réplica/cache temporal** (solo compat V1): `prospects.next_action_at / prospects.next_action_note` se mantienen sincronizados para no romper pantallas/queries legacy, pero **no** son la fuente de verdad.

---

### Paso 1 — `POST /api/v2/commercial-interactions` ✅ IMPLEMENTADO

Cambios de contrato:

- `agendaActionId`: **opcional**
- `nextActionAt`: **opcional**
- `nextActionNote`: **opcional** (solo compat cuando se cierra una acción)

**Decisión (alineada con D7 "2 pasos siempre"):** este endpoint NO gestiona "próxima acción" salvo en el caso explícito de cerrar una acción de agenda (modo `done`/`completed_and_created`). La creación/modificación/reprogramación/sobreescritura ocurre **solo** vía `resolve-next-action`.

**Semántica cerrada:**

| `agendaActionId` | `nextActionAt` | Comportamiento                                                                                       |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| presente         | ausente        | Marcar acción como `done`                                                                            |
| presente         | presente       | `done` + crear nueva `pending` (`completed_and_created`) — compat con flujo lineal                   |
| ausente          | ausente        | Guardar interacción. Agenda no se toca.                                                              |
| ausente          | presente       | **422 fail fast**: forzar al Paso 2 (`resolve-next-action`). El comercial cree que programó pero no. |

---

### Paso 2 — `POST /api/v2/crm/agenda/resolve-next-action` ✅ IMPLEMENTADO

Diseño: **S1** — un endpoint + `strategy` obligatorio, con validación estricta por estrategia.

**Payload:**

```json
{
  "targetType": "prospect|customer",
  "targetId": 10,
  "strategy": "keep|update|reschedule|override|create_if_none",
  "nextActionAt": "2026-03-20",
  "description": "Enviar propuesta",
  "reason": "Sobrescrita por nueva acción",
  "sourceInteractionId": 501
}
```

**Validación estricta por estrategia:**

| Estrategia       | Requiere                 | Permite       | Prohíbe                                                        |
| ---------------- | ------------------------ | ------------- | -------------------------------------------------------------- |
| `keep`           | —                        | —             | `nextActionAt`, `description`, `reason`, `sourceInteractionId` |
| `update`         | `description`            | —             | `nextActionAt`, `reason`                                       |
| `reschedule`     | `nextActionAt`           | `description` | `reason`                                                       |
| `override`       | `nextActionAt`, `reason` | `description` | —                                                              |
| `create_if_none` | `nextActionAt`           | `description` | `reason`                                                       |

**Semántica:**

- `keep`: no cambia nada en DB. Si se necesita auditoría, modelarla explícitamente (p. ej. `agenda_events`).
- `update`: edita solo `description` de la `pending` actual.
- `reschedule`: la anterior pasa a `reprogrammed`, se crea nueva `pending` con `previous_action_id` apuntando a la anterior inmediata.
- `override`: la anterior pasa a `cancelled`, se guarda `reason`, se crea nueva `pending` con `previous_action_id` apuntando a la anterior inmediata.
- `create_if_none`: si no existe `pending`, crea una nueva. Si ya existe → error `PENDING_EXISTS`.

**Política de cadena (`previous_action_id`):**

- En `reschedule` y `override`, la nueva acción apunta a la anterior inmediata (aunque esa anterior ya tenga `previous_action_id`).
- La acción que se transiciona debe seguir en `pending` al momento del update y pertenecer al `targetType/targetId` indicado.

**Atomicidad y concurrencia:**

- Operación atómica (transacción) + `SELECT ... FOR UPDATE` de la `pending` actual antes de crear.
- Si la `pending` cambia entre preflight y submit → `422` con `code: STALE_PENDING`.
- Nota MySQL: un "índice único parcial por `status=pending`" no es trivial; el enfoque recomendado es locking transaccional.

\*Coherencia con legacy `prospects.next_action_` (V1):\*\*

- Cuando `targetType = prospect`, el backend replica a `prospects.next_action_`\* el estado de la `pending` actual (fecha + `description`) para compatibilidad con vistas/queries existentes.

---

### Errores estables (códigos)

Formato `422`:

```json
{
  "message": "Validation error",
  "userMessage": "No se pudo actualizar la próxima acción.",
  "code": "INVALID_STRATEGY_FIELDS",
  "errors": {
    "nextActionAt": ["nextActionAt es obligatorio para strategy=override."]
  }
}
```

| Código                    | Cuándo                                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `PENDING_EXISTS`          | Ya existe `pending` activa y `create_if_none` no puede continuar           |
| `NO_PENDING_TO_UPDATE`    | `update`/`reschedule`/`override`/`keep` requieren `pending` pero no existe |
| `STALE_PENDING`           | La `pending` cambió entre preflight y submit (concurrencia optimista)      |
| `INVALID_STRATEGY_FIELDS` | Campos presentes/ausentes no cumplen la tabla de validación                |
| `TARGET_MISMATCH`         | La `pending` encontrada no corresponde al target indicado                  |
| `PENDING_NOT_ACTIVE`      | La acción a transicionar ya no está en `pending`                           |

**Regla explícita (`update` sin pending):** si `strategy=update` y no existe `pending` activa, el backend devuelve `422` con `code = NO_PENDING_TO_UPDATE` y `errors` apuntando a `strategy` y/o `target`.

---

### Contrato de respuesta (`resolve-next-action`)

Siempre devuelve: `previousPending`, `currentPending`, `changed`.

#### Ejemplo: `override`

```json
{
  "message": "Próxima acción actualizada correctamente.",
  "data": {
    "strategy": "override",
    "changed": true,
    "previousPending": {
      "agendaActionId": 100,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones",
      "status": "cancelled",
      "previousActionId": null
    },
    "currentPending": {
      "agendaActionId": 101,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-20",
      "description": "Enviar muestra",
      "status": "pending",
      "previousActionId": 100
    }
  }
}
```

#### Ejemplo: `keep`

```json
{
  "message": "Próxima acción mantenida.",
  "data": {
    "strategy": "keep",
    "changed": false,
    "previousPending": {
      "agendaActionId": 100,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones",
      "status": "pending",
      "previousActionId": null
    },
    "currentPending": {
      "agendaActionId": 100,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones",
      "status": "pending",
      "previousActionId": null
    }
  }
}
```

#### Ejemplo: `reschedule`

```json
{
  "message": "Acción reprogramada correctamente.",
  "data": {
    "strategy": "reschedule",
    "changed": true,
    "previousPending": {
      "agendaActionId": 200,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones",
      "status": "reprogrammed",
      "previousActionId": null
    },
    "currentPending": {
      "agendaActionId": 201,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-25",
      "description": "Llamar para confirmar condiciones",
      "status": "pending",
      "previousActionId": 200
    }
  }
}
```

#### Ejemplo: `update`

```json
{
  "message": "Acción actualizada correctamente.",
  "data": {
    "strategy": "update",
    "changed": true,
    "previousPending": {
      "agendaActionId": 300,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones",
      "status": "pending",
      "previousActionId": null
    },
    "currentPending": {
      "agendaActionId": 300,
      "targetType": "prospect",
      "targetId": 10,
      "scheduledAt": "2026-03-18",
      "description": "Llamar para confirmar condiciones (pide responder por WhatsApp)",
      "status": "pending",
      "previousActionId": null
    }
  }
}
```

---

### Concurrencia (UX esperada)

Caso real: dos pestañas o dos usuarios resolviendo el mismo target.

- Si la `pending` cambia entre **preflight** y **submit**, el backend responde `422` con `code = STALE_PENDING` y `userMessage` accionable: _"La próxima acción ha cambiado. Recarga y revisa el estado actual."_
- **UX**: el frontend debe mostrar aviso y **recargar la `pending` actual** (re-ejecutar preflight).

---

### No-go

Si una interacción se registra **sin** `agendaActionId`, la **única** vía para crear/modificar/reprogramar/sobreescribir la próxima acción es `resolve-next-action`. No hay caminos alternativos.

---

### Preflight — `GET /api/v2/crm/agenda/pending` ✅ IMPLEMENTADO

`GET /api/v2/crm/agenda/pending?targetType=...&targetId=...`

Devuelve:

- `data: null` si no hay `pending` activa.
- O `data` con la `pending` actual + campos derivados:
  - `isOverdue` (bool)
  - `daysOverdue` (int)
  - `ageDays` (int, opcional — para distinguir "muy vencida" vs "poco vencida")

**Nota de fechas y timezone (V1):** `nextActionAt` y `scheduled_at` se tratan como fecha de negocio (`YYYY-MM-DD`, sin hora). El backend calcula `isOverdue`/`daysOverdue` usando `business_timezone` (`Europe/Madrid`) comparando por fecha.

---

### Artefactos backend existentes ✅

- `app/Services/v2/CrmAgendaService.php` — métodos: `createPendingFromInteraction`, `syncFromInteraction`, `reschedule`, `cancel`, `completeFromInteraction`, `getPendingForTarget`
- `app/Services/v2/CommercialInteractionService.php` — `store()` (acoplado a agenda en transacción)
- `app/Http/Requests/v2/StoreCommercialInteractionRequest.php`
- `app/Http/Requests/v2/StoreCrmAgendaActionRequest.php`
- `app/Http/Requests/v2/RescheduleCrmAgendaActionRequest.php`
- `app/Http/Requests/v2/CancelCrmAgendaActionRequest.php`
- `app/Http/Controllers/v2/CrmAgendaController.php`
- `app/Http/Controllers/v2/CommercialInteractionController.php`
- `app/Models/AgendaAction.php`
- `database/migrations/companies/2026_03_18_130000_create_agenda_actions_table.php`
- `database/migrations/companies/2026_03_19_000100_allow_reprogrammed_status_in_agenda_actions.php`

### Artefactos backend incorporados en esta iteración ✅

- `app/Http/Requests/v2/ResolveNextActionRequest.php`
- `app/Http/Requests/v2/ShowCrmAgendaPendingRequest.php`
- Migración: `database/migrations/companies/2026_03_26_180000_add_reason_to_agenda_actions_table.php`
- Ruta: `POST /api/v2/crm/agenda/resolve-next-action`
- Ruta: `GET /api/v2/crm/agenda/pending`

---

## Definition of Done (backend cumplido)

### Sprint 1 — Paso 1 desacoplado ✅

- Una interacción se guarda correctamente aunque `resolve-next-action` falle o no se llame.
- `POST /commercial-interactions` acepta `agendaActionId` ausente sin requerir `nextActionAt`.
- Los 4 casos de la tabla de semántica del Paso 1 funcionan correctamente.
- Ningún error de agenda provoca rollback de la interacción.

### Sprint 2 — `resolve-next-action` ✅

- `keep` no muta nada en DB y devuelve `changed: false`.
- `update` edita solo `description` de la `pending` activa.
- `reschedule` marca la anterior como `reprogrammed` y crea nueva `pending` con `previous_action_id`.
- `override` marca la anterior como `cancelled`, guarda `reason`, crea nueva `pending` con `previous_action_id`.
- `create_if_none` crea `pending` solo si no existe; error `PENDING_EXISTS` si existe.
- Operación atómica con `SELECT ... FOR UPDATE` para evitar race conditions.
- Todos los errores devuelven `code` estable.
- Respuesta incluye siempre `previousPending`, `currentPending` y `changed`.

### Sprint 3 — Preflight ✅

- `GET /crm/agenda/pending?targetType=...&targetId=...` devuelve `data: null` o la `pending` activa con `isOverdue` y `daysOverdue`.
- El endpoint es de solo lectura y no muta estado.

### Transversal

- Ninguna operación produce inconsistencias de "2 `pending` activas para el mismo target".
- Tests de feature cubren al menos: crear interacción sin agenda, las 5 estrategias de `resolve-next-action`, preflight con y sin `pending`.

---

## Pendientes de definir

- **D10**: Definir si el panel contextual se basa en una copia adaptada de las vistas existentes de cliente/prospecto y qué recortes/añadidos. _(Nota: se sugiere partir de las vistas existentes, añadiendo contexto de agenda.)_
- **Copy definitivo** de los CTAs y flujo guiado (textos exactos para el comercial).

## Siguiente afinado recomendado

1. **Definir D10** (panel contextual): contenido mínimo por tipo target (cliente vs prospecto) y grado de reutilización de vistas existentes.
2. Ajustar el frontend para consumir `code`, `errors`, `previousPending/currentPending/changed` en todos los flujos.
3. Completar QA de flujo guiado (Agenda + ficha prospecto/cliente + alta prospecto) contra el contrato backend ya implementado.

---

## Ajustes frontend acordados tras la nueva lógica backend

Esta sección aterriza cómo deben cambiar las pantallas de frontend que hoy mezclan interacción y próxima acción en un único formulario.

### 1) Alta de prospecto (decisión confirmada: opción A)

#### Comportamiento objetivo

- El formulario de alta de prospecto incluye:
  - datos del prospecto
  - datos de contacto principal
- La próxima acción **no** se crea en el mismo submit principal del alta como flujo mezclado.
- Tras crear el prospecto correctamente, se ofrece un paso opcional:
  - “¿Programar próxima acción ahora?”
  - si el usuario acepta, se ejecuta el Paso 2 con `resolve-next-action` usando estrategia `create_if_none`.

#### Resultado esperado

- La alta sigue siendo rápida.
- La lógica de próxima acción se mantiene en un único motor de resolución.
- Se evita introducir caminos alternativos fuera del flujo oficial.

### 2) Nueva interacción desde ficha de prospecto/cliente (decisión confirmada)

#### Comportamiento objetivo

- La creación de interacción en ficha sigue el mismo patrón que Agenda:
  - **Paso 1:** guardar interacción (siempre guardable)
  - **Paso 2:** gestionar próxima acción (flujo separado)
- El bloque de próxima acción deja de ser una lógica única mezclada en el submit principal de interacción.

#### Reglas UX

- Si existe pending activa, mostrar preflight:
  - retomar pendiente
  - continuar registrando interacción
  - ver detalle (solo lectura)
- Tras guardar interacción, resolver próxima acción con estrategias:
  - `keep`
  - `update`
  - `reschedule`
  - `override`
  - `create_if_none`

### 3) Regla transversal de consistencia frontend

- Agenda, alta de prospecto y ficha de prospecto/cliente deben usar el mismo motor de resolución de próxima acción (Paso 2), variando solo el punto de entrada UX.
- Evitar formularios mixtos nuevos que vuelvan a mezclar, en un único submit, la lógica completa de interacción + próxima acción fuera de los casos de compatibilidad explícitos del backend.
