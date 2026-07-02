# Propuesta de evolución del sistema de IA — Auditoría profunda orquestada, GAPs v2 y mejora continua por módulos

## 1. Contexto

La Pesquerapp ya cuenta con un sistema avanzado de trabajo asistido por IA. Actualmente existen agentes, skills, comandos, workflows y reglas repartidas principalmente entre:

* Claude Code
* Cursor
* Codex
* Copilot
* Documentación neutral en `docs/agent-system/**`
* Sistema de GAPs legacy en `.claude/gaps/**`

El sistema actual ya permite auditar, detectar problemas, generar GAPs, implementar GAPs, revisar implementaciones y mantener ciertas memorias de trabajo. Sin embargo, todavía existe un problema de fondo: el sistema no funciona como una cadena de trabajo totalmente orquestada, retomable y profunda por módulo.

Actualmente, una auditoría puede generar GAPs, pero el proceso sigue dependiendo demasiado de sesiones concretas de chat, contexto acumulado y gestión manual. También ocurre que los GAPs están clasificados principalmente por estado físico (`open`, `in-progress`, `closed`), no por módulo, categoría, riesgo o tamaño. Esto dificulta elegir después qué tipo de trabajo implementar: diseño, UX, arquitectura, refactor, performance, responsive, etc.

El objetivo de esta propuesta es definir una evolución profesional del sistema actual para convertirlo en una plataforma de auditoría profunda y mejora continua por módulos, manteniendo compatibilidad con lo que ya funciona.

---

## 2. Diagnóstico resumido del sistema actual

### 2.1 Lo que ya está bien

El sistema actual tiene muchas piezas valiosas:

* Sistema de agentes de Claude Code bastante maduro.
* Adaptadores para Codex en `.agents/skills/**`.
* Reglas de Cursor en `.cursor/rules/**`.
* Documentación neutral en `docs/agent-system/**`.
* Sistema de GAPs legacy probado en `.claude/gaps/**`.
* Agentes de auditoría técnica, UI, diseño, skeletons, UX, mobile, frontend, documentación, API y dominio.
* Workflow de discovery, implementación y auditoría de GAPs.
* Historial real de GAPs ya generados e implementados.
* Herramientas Playwright y contexto visual para auditorías UI/skeleton.
* Memorias internas y documentación auxiliar.

Esto significa que no hay que empezar de cero.

La estrategia correcta no debe ser sustituir todo el sistema existente, sino crear una capa superior de orquestación y trazabilidad.

### 2.2 Lo que falta

El sistema actual todavía no tiene de forma clara:

* Auditoría canónica por módulo.
* Archivo `audit.md` vivo por módulo.
* Matriz de cobertura por módulo.
* Estado profesional por módulo.
* Registry de GAPs por módulo.
* Clasificación física de GAPs por categoría.
* Normalizador/deduplicador de GAPs.
* Orquestador de auditoría profunda.
* Sistema robusto para retomar auditorías entre chats/modelos.
* `next-action.md` global.
* `worklog.md` global.
* Workflow de implementación por lotes filtrando por categoría, riesgo y tamaño.
* Separación clara entre auditoría, normalización, implementación y verificación.
* Taxonomía común obligatoria para Claude, Cursor y Codex.
* Reglas fuertes para evitar documentos duplicados como `audit-final.md`, `audit-v2.md` o `audit-2026-xx-xx.md`.

---

## 3. Problema principal

El problema no es que falten agentes o prompts aislados.

El problema principal es que el sistema todavía no tiene una fuente de verdad operativa para coordinar auditorías profundas por módulo.

Ahora mismo el flujo tiende a ser:

```text
Auditoría en chat
  → generación de GAPs
  → implementación en otro chat
  → revisión
  → documentación dispersa
```

El riesgo de este flujo es:

* Mucha información queda en el chat.
* Si el chat se satura, se pierde continuidad.
* Si se abre otro modelo, no siempre sabe exactamente qué se hizo.
* Las auditorías pueden repetirse sin baseline claro.
* Los GAPs pueden duplicarse.
* No hay una visión de cobertura real.
* No se sabe qué parte del módulo se auditó y qué parte no.
* Se mezclan GAPs de diseño, código, arquitectura, UX, API, responsive, etc.
* Implementar “todos los GAPs posibles” se vuelve caótico.
* El usuario tiene que actuar como project manager manual.

La solución es cambiar el centro de gravedad:

```text
El chat no es memoria.
Los archivos son memoria.
```

---

## 4. Objetivo de la nueva capa v2

Crear una capa documental y operativa en `docs/ai/**` que permita:

1. Auditar módulos completos de forma profunda y profesional.
2. Orquestar múltiples auditorías especializadas sin saturar el contexto principal.
3. Registrar el estado de cada módulo en archivos persistentes.
4. Permitir que otro chat/modelo continúe desde donde se quedó.
5. Clasificar GAPs por módulo y categoría.
6. Implementar GAPs después por lotes controlados.
7. Evitar duplicación documental.
8. Mantener compatibilidad con el sistema legacy actual.
9. Usar Claude, Cursor y Codex contra una fuente neutral compartida.
10. Convertir la IA en una cadena de mejora continua, no en una colección de prompts sueltos.

---

## 5. Principio arquitectónico

La arquitectura debe basarse en esta idea:

```text
El conocimiento vive en archivos.
Los chats son trabajadores temporales.
Cada agente recibe una tarea concreta.
Cada agente escribe resultados estructurados.
El siguiente agente continúa desde archivos, no desde memoria conversacional.
```

Esto permite que:

* Una auditoría pueda durar varias sesiones.
* Se puedan consumir tokens sin miedo a perder el hilo.
* Un modelo pueda retomar lo iniciado por otro.
* El usuario pueda revisar el avance leyendo archivos.
* Los GAPs puedan implementarse por categoría.
* El sistema escale sin depender de un único chat infinito.

---

## 6. Decisión estratégica

No se debe migrar todo de golpe.

La decisión recomendada es:

```text
No tocar todavía el sistema legacy de .claude/gaps/**.
No mover GAPs antiguos.
No romper Claude Code.
No duplicar comandos sin necesidad.
Crear primero una capa v2 en docs/ai/**.
Usar un módulo piloto.
Validar el flujo.
Después extenderlo.
```

Módulo piloto recomendado:

```text
Slug técnico: orders
Nombre humano: Pedidos
```

Motivo:

* Es un módulo importante.
* Tiene suficiente complejidad real.
* Permite probar UI, UX, formularios, tablas, estados, dominio, API y arquitectura.
* Si funciona en Pedidos, funcionará en otros módulos.

---

## 7. Nueva estructura propuesta

Se propone crear esta estructura:

```text
docs/ai/
  README.md
  next-action.md
  worklog.md

  templates/
    module-audit-template.md
    module-status-template.md
    coverage-matrix-template.md
    gap-v2-template.md
    gaps-registry-template.md

  modules/
    orders/
      audit.md
      status.md
      coverage-matrix.md
      gaps-registry.md

  gaps/
    orders/
      ux-ui/
      design-system/
      code-quality/
      architecture/
      refactor/
      performance/
      accessibility/
      responsive/
      data-api/
      domain-business/
      testing/
      docs/
```

Más adelante, para otros módulos:

```text
docs/ai/modules/pallets/
docs/ai/modules/products/
docs/ai/modules/stock/
docs/ai/modules/customers/
docs/ai/modules/suppliers/
docs/ai/modules/production/
docs/ai/modules/dashboard/
docs/ai/modules/settings/
```

Y sus GAPs:

```text
docs/ai/gaps/pallets/
docs/ai/gaps/products/
docs/ai/gaps/stock/
...
```

---

## 8. Regla de auditoría canónica

Cada módulo debe tener una única auditoría canónica:

```text
docs/ai/modules/{module}/audit.md
```

Queda prohibido crear documentos como:

```text
audit-v2.md
audit-final.md
audit-2026-07-02.md
deep-audit.md
new-audit.md
auditoria-final.md
```

La historia de auditorías se conserva con Git, no creando copias manuales.

Cuando se repite una auditoría completa sobre el mismo módulo:

1. Se lee el `audit.md` existente.
2. Se usa como baseline.
3. Se revisa el código actual.
4. Se decide qué hallazgos siguen vigentes.
5. Se eliminan hallazgos obsoletos.
6. Se actualiza el mismo `audit.md`.
7. Se actualizan los GAPs y el registry.

El `audit.md` debe representar el estado actual del módulo, no una acumulación histórica infinita.

---

## 9. Qué debe contener `audit.md`

El archivo:

```text
docs/ai/modules/{module}/audit.md
```

debe actuar como panel de control de la auditoría.

Debe contener:

```text
1. Control de auditoría
2. NEXT ACTION
3. Resumen ejecutivo
4. Baseline anterior
5. Alcance del módulo
6. Cobertura
7. Hallazgos vigentes
8. GAPs generados o actualizados
9. GAPs resueltos o descartados
10. Bloqueos
11. Riesgos
12. Decisiones tomadas
13. Cambios desde última auditoría
14. Instrucciones para retomar en otro chat/modelo
15. Reglas para futuras auditorías
```

La sección `NEXT ACTION` debe estar arriba.

Motivo:

Si el chat se corta o se abre otra sesión, el nuevo agente debe poder leer ese archivo y saber exactamente qué hacer.

Ejemplo:

```md
## NEXT ACTION

Ejecutar:

/implement-next module=orders category=ux-ui limit=3 risk=low

Contexto:
La auditoría UX/UI está normalizada.
Hay 5 GAPs ready de bajo riesgo.
No auditar de nuevo.
No tocar backend.
Actualizar registry y worklog al terminar.
```

---

## 10. `status.md` por módulo

Cada módulo debe tener:

```text
docs/ai/modules/{module}/status.md
```

Este archivo debe resumir el estado profesional del módulo.

Debe cubrir:

* Estado funcional.
* Estado UI.
* Estado UX.
* Estado código.
* Estado arquitectura.
* Estado responsive.
* Estado accesibilidad.
* Estado performance.
* Estado testing.
* Estado documentación.
* P0/P1/P2/P3 abiertos.
* Estado de auditoría.
* Estado de implementación.
* Estado de verificación.
* Criterios de cierre.

Estados posibles:

```text
not_started
auditing
ready_for_implementation
implementing
needs_verification
blocked
closed
stale
```

Este archivo permite saber rápidamente si un módulo está abierto, en auditoría, listo para implementar, bloqueado o cerrado.

---

## 11. `coverage-matrix.md` por módulo

Cada módulo debe tener:

```text
docs/ai/modules/{module}/coverage-matrix.md
```

Este archivo resuelve un problema muy importante: evitar auditorías falsas o superficiales.

Una IA puede decir “he auditado Pedidos”, pero en realidad haber revisado solo una página, un formulario o dos componentes. La matriz obliga a declarar qué se ha cubierto y qué no.

### 11.1 Superficies recomendadas

```text
listado
detalle
creación
edición
formularios
tablas/listados
estados loading
estados empty
estados error
estados success
responsive desktop
responsive tablet
responsive mobile
permisos/roles
integración API
validaciones
tipos/interfaces
componentización
accesibilidad
performance
copy/semántica
dominio de negocio
testing
```

### 11.2 Carriles recomendados

```text
product-domain
ux
ui
design-system
frontend-architecture
code-quality
refactor
performance
accessibility
responsive
forms
tables
loading-skeletons
empty-error-states
data-api
testing-qa
security
copy-semantics
documentation
```

### 11.3 Estados de cobertura

```text
pending
partial
audited
needs_reaudit
not_applicable
```

Ejemplo de matriz:

```md
| Superficie | UX | UI | Code Quality | Architecture | Responsive | Data/API | Testing |
|---|---|---|---|---|---|---|---|
| listado | pending | pending | pending | pending | pending | pending | pending |
| creación | pending | pending | pending | pending | pending | pending | pending |
| edición | pending | pending | pending | pending | pending | pending | pending |
| estados empty | pending | pending | not_applicable | not_applicable | pending | not_applicable | pending |
```

---

## 12. `gaps-registry.md` por módulo

Cada módulo debe tener:

```text
docs/ai/modules/{module}/gaps-registry.md
```

Este archivo es el índice operativo de GAPs del módulo.

Debe incluir columnas:

```text
GAP
título
categoría
subcategoría
prioridad
riesgo
tamaño
estado
dependencias
archivos objetivo
origen
última actualización
```

Debe tener secciones:

```text
Ready
In progress
Blocked
Done
Later
Legacy references
```

La sección `Legacy references` es importante para convivir con `.claude/gaps/**`.

Ejemplo:

```md
## Legacy references

| Legacy GAP | Estado legacy | Relación | Nota |
|---|---|---|---|
| .claude/gaps/closed/GAP-111-orders-list-skeleton-mobile-desktop-fidelity.md | closed | relacionado | GAP skeleton previo útil como baseline |
```

Esto permite enlazar GAPs antiguos sin moverlos.

---

## 13. GAPs v2 clasificados físicamente

El sistema actual guarda GAPs por estado:

```text
.claude/gaps/open/
.claude/gaps/in-progress/
.claude/gaps/closed/
```

La nueva capa debe guardar GAPs por:

```text
módulo + categoría
```

Estructura:

```text
docs/ai/gaps/{module}/{category}/GAP-XXX-{module}-{category}-{slug}.md
```

Ejemplo:

```text
docs/ai/gaps/orders/ux-ui/GAP-116-orders-ux-ui-order-form-hierarchy.md
docs/ai/gaps/orders/code-quality/GAP-117-orders-code-quality-extract-form-logic.md
docs/ai/gaps/orders/responsive/GAP-118-orders-responsive-lines-table-mobile.md
docs/ai/gaps/orders/data-api/GAP-119-orders-data-api-error-handling.md
```

Esto permite lanzar implementaciones como:

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

o:

```text
/implement-next module=orders category=code-quality limit=2 risk=medium
```

Sin mezclar tipos de trabajo.

---

## 14. Categorías físicas recomendadas para GAPs

Categorías iniciales:

```text
ux-ui
design-system
code-quality
architecture
refactor
performance
accessibility
responsive
data-api
domain-business
testing
docs
```

### 14.1 `ux-ui`

Para problemas de experiencia de usuario e interfaz que no sean estrictamente design system.

Ejemplos:

* Jerarquía visual de formularios.
* Flujo poco claro.
* Acciones confusas.
* Feedback insuficiente.
* Estados vacíos poco útiles.
* Mensajes poco claros.
* Densidad de información.
* Agrupación de secciones.

### 14.2 `design-system`

Para inconsistencias del sistema visual.

Ejemplos:

* Botones con estilos diferentes.
* Cards no alineadas al patrón común.
* Uso inconsistente de spacing.
* Variantes visuales no normalizadas.
* Componentes duplicados que deberían usar primitives comunes.
* Inconsistencia shadcn/Tailwind.

### 14.3 `code-quality`

Para calidad interna sin cambiar arquitectura grande.

Ejemplos:

* Naming.
* Duplicación simple.
* Funciones demasiado largas.
* Tipos débiles.
* Código muerto.
* Condiciones complejas.
* Separación menor de responsabilidades.

### 14.4 `architecture`

Para estructura general.

Ejemplos:

* Separación de capas.
* Responsabilidad de componentes.
* Organización de módulos.
* Contratos frontend/backend.
* Patrones de datos.
* Boundaries.
* Dependencias internas.

### 14.5 `refactor`

Para cambios internos de implementación.

Ejemplos:

* Extraer hooks.
* Extraer componentes.
* Separar lógica de presentación.
* Reorganizar archivos.
* Reducir acoplamiento.
* Unificar patrones repetidos.

Diferencia con `architecture`:

* `architecture` decide estructura.
* `refactor` ejecuta cambios acotados dentro de una estructura ya decidida.

### 14.6 `performance`

Para rendimiento frontend.

Ejemplos:

* Renderizados innecesarios.
* Memoización.
* Carga diferida.
* Query/cache.
* Tablas pesadas.
* Imágenes.
* Bundles.
* Revalidaciones innecesarias.

### 14.7 `accessibility`

Para accesibilidad.

Ejemplos:

* Labels.
* Focus states.
* Navegación teclado.
* Contraste.
* ARIA.
* Semántica HTML.
* Estados de error accesibles.
* Modales/dialogs accesibles.

### 14.8 `responsive`

Para adaptación por pantalla.

Ejemplos:

* Desktop.
* Tablet.
* Mobile.
* Tablas en móvil.
* Formularios en móvil.
* Acciones sticky.
* Overflow.
* Layouts rotos.

### 14.9 `data-api`

Para integración de datos.

Ejemplos:

* Errores de API.
* Loading states dependientes de queries.
* Invalidación de caché.
* Contratos de servicios.
* TanStack Query.
* Normalización de respuestas.
* Manejo de estados remotos.

### 14.10 `domain-business`

Para lógica de negocio y dominio pesquero/ERP.

Ejemplos:

* Pedidos.
* Palets.
* Stock.
* Producción.
* Clientes/proveedores.
* Trazabilidad.
* Congelado/fresco.
* Pesos, tallas, formatos, FAO, lotes.
* Maquila.
* Reglas específicas del sector.

### 14.11 `testing`

Para validación técnica.

Ejemplos:

* Tests unitarios.
* Tests integración.
* Tests UI.
* Playwright.
* Fixtures.
* Casos borde.
* Regression checks.

### 14.12 `docs`

Para documentación.

Ejemplos:

* Documentar decisiones.
* Actualizar workflows.
* ADRs.
* Guías internas.
* README.
* Estado de módulo.
* Guías de patrones.

---

## 15. Campos obligatorios de un GAP v2

Cada GAP v2 debe tener al menos:

```yaml
id:
title:
module:
module_human_name:
category:
subcategory:
priority:
risk:
size:
status:
origin_audit:
origin_finding:
owner_agent:
created_at:
updated_at:
target_files:
related_files:
dependencies:
blocks:
non_goals:
```

Y secciones:

```md
## Problema

## Objetivo

## Contexto

## Solución propuesta

## Criterios de aceptación

## Plan de validación

## Notas de implementación

## Resultado

## Resultado de auditoría

## Links
```

### 15.1 Priority

```text
P0 — crítico
P1 — importante
P2 — recomendable
P3 — pulido
P4 — futuro/later
```

### 15.2 Risk

```text
low
medium
high
```

### 15.3 Size

```text
XS — cambio mínimo, 1 archivo
S — pequeño, 1-3 archivos
M — medio, 3-6 archivos
L — grande, requiere planificación
XL — no implementar en sesión normal
```

### 15.4 Status

```text
candidate
ready
in_progress
done
blocked
rejected
later
```

Regla:

```text
Los implementadores solo pueden coger por defecto GAPs ready con risk=low|medium y size=XS|S|M, salvo autorización explícita.
```

---

## 16. Workflow: auditoría profunda por módulo

Comando propuesto:

```text
/deep-audit-module module={module} depth=deep
```

Ejemplo:

```text
/deep-audit-module module=orders depth=deep
```

### 16.1 Objetivo

Ejecutar una auditoría profunda de un módulo sin saturar el chat principal.

El orquestador debe:

1. Leer baseline.
2. Mapear el módulo.
3. Planificar cobertura.
4. Lanzar auditorías por carril/superficie.
5. Generar GAPs v2.
6. Clasificar GAPs por categoría.
7. Normalizar/deduplicar.
8. Actualizar registry.
9. Actualizar estado.
10. Escribir próxima acción.
11. Devolver resumen corto al chat.

### 16.2 Flujo obligatorio

```text
1. Read baseline
2. Map module
3. Plan coverage
4. Run lane audits
5. Write categorized GAP files
6. Merge audit
7. Normalize/deduplicate GAPs
8. Update registry
9. Update status
10. Write next action
11. Return short summary
```

### 16.3 Archivos que debe leer

```text
AGENTS.md
CLAUDE.md
docs/agent-system/**
docs/ai/README.md
docs/ai/modules/{module}/audit.md
docs/ai/modules/{module}/status.md
docs/ai/modules/{module}/coverage-matrix.md
docs/ai/modules/{module}/gaps-registry.md
docs/ai-context/**
docs/agents/**
.claude/gaps/** solo para referencias legacy cuando aplique
```

### 16.4 Archivos que debe escribir

```text
docs/ai/modules/{module}/audit.md
docs/ai/modules/{module}/status.md
docs/ai/modules/{module}/coverage-matrix.md
docs/ai/modules/{module}/gaps-registry.md
docs/ai/gaps/{module}/{category}/GAP-XXX-*.md
docs/ai/next-action.md
docs/ai/worklog.md
```

### 16.5 Qué debe devolver al chat

Solo un resumen corto:

```text
- módulo auditado
- cobertura alcanzada
- GAPs creados/actualizados
- GAPs ready
- GAPs blocked
- riesgos principales
- archivos actualizados
- siguiente acción
```

### 16.6 Qué no debe devolver al chat

No debe devolver:

```text
- auditoría completa
- contenido completo de todos los GAPs
- razonamientos largos
- diffs enormes
- listas interminables
```

Todo eso debe escribirse en archivos.

---

## 17. Workflow: normalización de GAPs

Comando propuesto:

```text
/normalize-gaps module={module}
```

o:

```text
/normalize-gaps module=orders category=ux-ui
```

### 17.1 Objetivo

Convertir hallazgos y GAPs candidatos en GAPs realmente implementables.

### 17.2 Responsabilidades

El normalizador debe:

* Detectar duplicados.
* Fusionar GAPs parecidos.
* Dividir GAPs grandes.
* Asignar categoría.
* Asignar subcategoría.
* Asignar prioridad.
* Asignar riesgo.
* Asignar tamaño.
* Validar campos obligatorios.
* Revisar dependencias.
* Marcar GAPs como `ready`, `blocked`, `later` o `rejected`.
* Actualizar `gaps-registry.md`.
* Actualizar `audit.md`.
* Actualizar `next-action.md`.

### 17.3 Reglas

```text
No borrar GAPs sin registrar decisión.
No dejar GAPs L/XL como ready salvo autorización.
No dejar GAPs sin criterios de aceptación.
No dejar GAPs sin plan de validación.
No dejar GAPs sin categoría física.
No mezclar problemas distintos en un mismo GAP.
```

---

## 18. Workflow: implementación por lotes

Comando propuesto:

```text
/implement-next module={module} category={category} limit={n} risk={risk}
```

Ejemplo:

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

### 18.1 Objetivo

Implementar GAPs de forma controlada, sin mezclar categorías ni saturar contexto.

### 18.2 Selección de GAPs

El implementador debe leer:

```text
docs/ai/modules/{module}/gaps-registry.md
```

Y seleccionar GAPs que cumplan:

```text
status=ready
category={category}
risk <= permitido
size=XS|S|M
sin dependencias abiertas
```

### 18.3 Reglas de implementación

```text
No auditar de nuevo.
No abrir temas nuevos.
No mezclar categorías salvo permiso explícito.
No coger GAPs L/XL salvo permiso explícito.
No tocar backend si el GAP no lo permite.
No añadir dependencias sin aprobación.
No cambiar contratos de datos sin aprobación.
Implementar uno por uno.
Actualizar estado tras cada GAP.
Validar al terminar.
```

### 18.4 Archivos que debe actualizar

```text
GAP v2 correspondiente
docs/ai/modules/{module}/gaps-registry.md
docs/ai/modules/{module}/status.md
docs/ai/modules/{module}/audit.md
docs/ai/worklog.md
docs/ai/next-action.md
```

### 18.5 Qué debe devolver al chat

Solo:

```text
- GAPs implementados
- GAPs bloqueados
- validaciones ejecutadas
- archivos modificados
- siguiente acción
```

---

## 19. Workflow: verificación independiente

Comando propuesto:

```text
/verify-last module={module}
```

o:

```text
/verify-gaps module={module} category={category}
```

### 19.1 Objetivo

Revisar con contexto limpio si los GAPs implementados cumplen criterios.

### 19.2 Reglas

El verificador no debe ser el mismo contexto que implementó si es posible.

Debe revisar:

* Criterios de aceptación.
* Validación técnica.
* Posibles regresiones.
* Coherencia visual.
* Coherencia funcional.
* No haber tocado archivos prohibidos.
* No haber mezclado scopes.
* Estado correcto del GAP.
* Registry actualizado.
* Audit/status/worklog actualizados.

### 19.3 Resultados posibles

```text
done
needs_fix
blocked
rejected
```

---

## 20. Sistema de `next-action.md`

Debe existir:

```text
docs/ai/next-action.md
```

Este archivo debe responder siempre a la pregunta:

```text
¿Qué debe hacer el siguiente agente/chat/modelo?
```

Debe incluir:

```text
- fecha
- módulo activo
- fase activa
- acción recomendada
- comando sugerido
- archivos clave
- restricciones
- estado resumido
- motivo
```

Ejemplo:

```md
# Next Action

## Acción recomendada

Ejecutar:

/implement-next module=orders category=ux-ui limit=3 risk=low

## Motivo

La auditoría profunda de Pedidos ha generado 7 GAPs UX/UI.
5 están ready.
2 están blocked por dependencias.

## Archivos clave

- docs/ai/modules/orders/audit.md
- docs/ai/modules/orders/gaps-registry.md
- docs/ai/gaps/orders/ux-ui/

## Restricciones

- No auditar de nuevo.
- No tocar backend.
- No implementar GAPs de architecture.
- Actualizar worklog al terminar.
```

---

## 21. Sistema de `worklog.md`

Debe existir:

```text
docs/ai/worklog.md
```

No debe ser una novela. Debe ser un log compacto.

Ejemplo:

```md
# AI Worklog

| Fecha | Módulo | Acción | Resultado | Siguiente |
|---|---|---|---|---|
| 2026-07-02 | orders | Inicialización docs/ai v2 | Estructura creada | deep-audit orders |
| 2026-07-02 | orders | Deep audit UX/UI | 8 GAPs generados | normalize gaps |
| 2026-07-02 | orders | Implement batch ux-ui | 3 GAPs done | verify-last |
```

Regla:

```text
El worklog explica qué pasó, no repite toda la auditoría.
```

---

## 22. Agentes nuevos recomendados

El sistema actual ya tiene muchos agentes útiles, pero para alcanzar una auditoría realmente profunda y profesional faltan algunos roles específicos.

### 22.1 Deep Audit Orchestrator

Responsabilidad:

* Coordinar la auditoría profunda.
* No implementar.
* No hacer auditorías largas él mismo.
* Dividir trabajo por carriles y superficies.
* Mantener corto el chat.
* Escribir/actualizar `audit.md`.
* Coordinar normalización.
* Actualizar `next-action.md`.

Output:

```text
Resumen corto + archivos actualizados.
```

### 22.2 Module Mapper

Responsabilidad:

* Mapear rutas, páginas, componentes, hooks, services, schemas, tipos, tests y documentación de un módulo.
* Crear o actualizar el alcance del módulo.
* Detectar qué archivos parecen formar parte del bloque.

Output:

```text
Sección "Alcance del módulo" en audit.md.
```

### 22.3 Coverage Planner

Responsabilidad:

* Construir o actualizar `coverage-matrix.md`.
* Dividir el módulo en superficies.
* Decidir qué carriles de auditoría aplican.
* Marcar `pending`, `partial`, `audited`, `needs_reaudit`, `not_applicable`.

Output:

```text
coverage-matrix.md actualizado.
```

### 22.4 Baseline Auditor

Responsabilidad:

* Leer auditoría anterior.
* Compararla con el estado actual.
* Decidir qué hallazgos siguen vigentes.
* Marcar hallazgos resueltos, obsoletos o convertidos en GAP.

Output:

```text
Sección "Baseline anterior" y "Cambios desde última auditoría".
```

### 22.5 Gap Normalizer

Responsabilidad:

* Deduplicar.
* Fusionar.
* Dividir.
* Clasificar.
* Asignar prioridad/riesgo/tamaño.
* Validar campos obligatorios.
* Preparar GAPs ready.

Output:

```text
GAPs limpios + gaps-registry.md actualizado.
```

### 22.6 Module Registry Maintainer

Responsabilidad:

* Mantener `gaps-registry.md`.
* Mantener relación con GAPs legacy.
* Asegurar estados consistentes.
* Detectar inconsistencias.

Output:

```text
Registry fiable.
```

### 22.7 Implementation Batch Planner

Responsabilidad:

* Seleccionar los próximos GAPs a implementar.
* Evitar mezclar categorías.
* Evitar GAPs demasiado grandes.
* Revisar dependencias.
* Proponer lote seguro.

Output:

```text
Lote de implementación recomendado.
```

### 22.8 Verification Auditor

Responsabilidad:

* Revisar GAPs implementados.
* Validar criterios de aceptación.
* Detectar regresiones.
* Decidir si se cierra, reabre o bloquea.

Output:

```text
Resultado de auditoría independiente.
```

---

## 23. Auditorías adicionales recomendadas

Además de las auditorías ya existentes, se recomienda añadir o reforzar los siguientes carriles.

### 23.1 Product Workflow Auditor

Analiza si el flujo completo tiene sentido para un usuario real del ERP.

Preguntas:

* ¿El flujo reproduce cómo trabaja una empresa pesquera?
* ¿Hay pasos innecesarios?
* ¿Faltan shortcuts?
* ¿El orden de campos es lógico?
* ¿El usuario puede completar tareas rápido?
* ¿Hay fricción operativa?
* ¿Hay errores que el sistema podría prevenir?

Categoría de GAP frecuente:

```text
domain-business
ux-ui
```

### 23.2 Business Rules Auditor

Audita reglas de negocio.

Ejemplos:

* Pesos.
* Tallas.
* Formatos.
* Palets.
* Lotes.
* Stock.
* Pedidos.
* Producción.
* Clientes/proveedores.
* Maquila.
* Congelado/fresco.
* Trazabilidad.

Categoría:

```text
domain-business
data-api
testing
```

### 23.3 Data Consistency Auditor

Audita coherencia de datos frontend.

Preguntas:

* ¿Los datos se transforman varias veces?
* ¿Hay campos duplicados?
* ¿Hay naming inconsistente?
* ¿Hay contratos débiles con API?
* ¿Hay normalización insuficiente?
* ¿Hay estados derivados mal calculados?

Categoría:

```text
data-api
code-quality
architecture
```

### 23.4 State Management Auditor

Audita estado local/remoto.

Preguntas:

* ¿Hay estado duplicado?
* ¿Hay formularios con demasiada lógica local?
* ¿Hay queries mal invalidadas?
* ¿Hay race conditions?
* ¿Hay loaders incorrectos?
* ¿Hay stale data?

Categoría:

```text
data-api
architecture
code-quality
performance
```

### 23.5 Error Handling Auditor

Audita manejo de errores.

Preguntas:

* ¿Los errores son visibles?
* ¿Son entendibles?
* ¿Se diferencian errores técnicos y de usuario?
* ¿Hay retry?
* ¿Hay fallback?
* ¿Hay errores silenciosos?
* ¿Se pierden datos del formulario?

Categoría:

```text
ux-ui
data-api
testing
```

### 23.6 Permission/Roles Auditor

Audita permisos y visibilidad.

Preguntas:

* ¿Usuarios sin permiso ven acciones?
* ¿Hay rutas protegidas?
* ¿Hay botones que fallan por permiso?
* ¿La UI anticipa restricciones?
* ¿Se muestran datos sensibles?

Categoría:

```text
security
data-api
ux-ui
```

Nota: actualmente no existe categoría física `security`; se recomienda añadirla o incluir estos GAPs en `data-api`/`architecture` hasta crear una categoría específica.

### 23.7 Security Frontend Auditor

Audita seguridad frontend razonable.

Preguntas:

* ¿Hay exposición innecesaria de datos?
* ¿Hay tokens en cliente?
* ¿Hay logs sensibles?
* ¿Hay rutas protegidas solo visualmente?
* ¿Hay inputs peligrosos?
* ¿Hay enlaces externos inseguros?
* ¿Hay dependencia de permisos solo frontend?

Categoría recomendada:

```text
security
```

Recomendación: añadir `security` como categoría física.

Nueva estructura recomendada:

```text
docs/ai/gaps/{module}/security/
```

### 23.8 Accessibility Auditor

Debe tener carril propio, no ser un checklist secundario.

Revisa:

* Navegación teclado.
* Focus visible.
* Labels.
* Roles.
* ARIA.
* Contraste.
* Modales.
* Tablas.
* Formularios.
* Mensajes de error.
* Lectores de pantalla.

Categoría:

```text
accessibility
```

### 23.9 Responsive/Device Auditor

Debe revisar por tipo de dispositivo:

* Desktop.
* Laptop.
* Tablet.
* Mobile.
* Pantallas estrechas.
* Tablas.
* Modales.
* Drawers.
* Formularios largos.

Categoría:

```text
responsive
```

### 23.10 Forms Auditor

Aunque ya hay reglas de formularios, conviene tener carril específico en deep audit.

Revisa:

* RHF/Zod.
* Validaciones.
* Errores.
* Campos obligatorios.
* Agrupación.
* Estados dirty.
* Estados disabled.
* Reset.
* Submit.
* Edición vs creación.
* Pérdida de datos.

Categoría:

```text
ux-ui
code-quality
data-api
```

### 23.11 Tables/List Auditor

Muy importante en un ERP.

Revisa:

* Densidad.
* Ordenación.
* Filtros.
* Búsqueda.
* Acciones.
* Bulk actions.
* Responsive.
* Empty state.
* Loading.
* Columnas.
* Totales.
* Sticky headers.
* Exportación si aplica.

Categoría:

```text
ux-ui
design-system
responsive
performance
```

### 23.12 Loading/Skeleton Auditor

Ya existe bastante bien, pero debe integrarse en deep audit.

Revisa:

* Fidelidad visual.
* Diferencias mobile/desktop.
* Skeleton vs layout real.
* Flash de contenido.
* Estados intermedios.
* Loading global vs parcial.

Categoría:

```text
ux-ui
design-system
loading-skeletons
```

Recomendación: añadir `loading-skeletons` como categoría física o subcategoría dentro de `ux-ui/design-system`.

### 23.13 Empty/Error/Success States Auditor

Auditoría específica para estados.

Revisa:

* Empty states.
* Error states.
* Success states.
* No results.
* No permissions.
* First-use state.
* Data unavailable.
* Offline/timeout si aplica.

Categoría:

```text
ux-ui
copy-semantics
data-api
```

Recomendación: añadir `copy-semantics` como categoría física o subcategoría.

### 23.14 Copy/Semantics Auditor

Audita textos y naming funcional.

Revisa:

* Labels.
* Botones.
* Estados.
* Tooltips.
* Mensajes de error.
* Confirmaciones.
* Terminología pesquera.
* Consistencia español/inglés.
* Claridad para usuario no técnico.

Categoría recomendada:

```text
copy-semantics
```

Nueva categoría física recomendada:

```text
docs/ai/gaps/{module}/copy-semantics/
```

### 23.15 Design System Compliance Auditor

Revisa adherencia al sistema visual.

Preguntas:

* ¿Se usan componentes comunes?
* ¿Hay variantes duplicadas?
* ¿Hay colores no estándar?
* ¿Hay spacing inconsistente?
* ¿Hay estilos inline evitables?
* ¿Hay patrones visuales no documentados?

Categoría:

```text
design-system
```

### 23.16 Component Reuse Auditor

Audita reutilización.

Preguntas:

* ¿Hay componentes duplicados?
* ¿Hay lógica copiada?
* ¿Hay patrones repetidos?
* ¿Faltan primitives?
* ¿Se podrían extraer bloques comunes?

Categoría:

```text
refactor
code-quality
design-system
```

### 23.17 Architecture Boundary Auditor

Audita límites arquitectónicos.

Preguntas:

* ¿Las páginas saben demasiado?
* ¿Los componentes mezclan UI, datos y dominio?
* ¿Los hooks tienen demasiadas responsabilidades?
* ¿Los services devuelven datos limpios?
* ¿Hay imports cruzados raros?
* ¿Hay acoplamiento innecesario?

Categoría:

```text
architecture
refactor
```

### 23.18 Performance Budget Auditor

Audita rendimiento con presupuesto.

Revisa:

* Renderizados.
* Componentes pesados.
* Tablas.
* Queries.
* Bundles.
* Imports.
* Lazy loading.
* Memoización.
* Re-renders por forms.
* Carga inicial.

Categoría:

```text
performance
```

### 23.19 Testability Auditor

No solo tests existentes, sino facilidad de testear.

Preguntas:

* ¿La lógica está separada para poder probarse?
* ¿Hay casos borde identificables?
* ¿Hay fixtures?
* ¿Hay dependencia excesiva de UI?
* ¿Faltan tests en flujos críticos?

Categoría:

```text
testing
architecture
code-quality
```

### 23.20 Regression Risk Auditor

Audita riesgo antes de implementar.

Clasifica:

* Bajo.
* Medio.
* Alto.

Detecta:

* Cambios con impacto en datos.
* Cambios en formularios críticos.
* Cambios que tocan API.
* Cambios que afectan varios módulos.
* Cambios visuales globales.
* Refactors transversales.

Categoría:

```text
testing
architecture
release
```

Recomendación: añadir `release` como categoría o subcategoría.

### 23.21 Release Readiness Auditor

Auditoría de cierre de módulo.

Revisa:

* P0/P1 abiertos.
* Validaciones.
* UX mínima.
* UI consistente.
* Responsive aceptable.
* Estados cubiertos.
* Errores controlados.
* Documentación actualizada.
* Riesgos conocidos.
* Decisión de cerrar módulo.

Categoría:

```text
testing
docs
release
```

### 23.22 Observability/Debuggability Auditor

Audita si el sistema es fácil de diagnosticar.

Revisa:

* Logs útiles.
* Errores capturados.
* Estados imposibles.
* Mensajes técnicos.
* Debug helpers.
* Información de contexto en errores.

Categoría:

```text
code-quality
data-api
testing
```

### 23.23 Internationalization/Localization Auditor

Aunque la app sea en español, conviene revisar:

* Textos hardcodeados.
* Fechas.
* Decimales.
* Moneda.
* Pesos.
* Separadores.
* Unidades.
* Plurales.
* Terminología.

Categoría recomendada:

```text
copy-semantics
domain-business
```

### 23.24 Data Formatting Auditor

Muy importante para ERP pesquero.

Revisa:

* kg.
* cajas.
* palets.
* precios.
* importes.
* porcentajes.
* fechas.
* tallas.
* formatos.
* lotes.
* FAO.
* especies.
* nombres comerciales.

Categoría:

```text
domain-business
ux-ui
data-api
```

### 23.25 Multi-tenant Auditor

Si La Pesquerapp es multi-tenant, debe haber auditoría específica.

Revisa:

* Aislamiento de datos.
* Tenant actual.
* Rutas.
* Queries.
* Caché.
* Filtros.
* Permisos.
* Riesgo de mezclar datos.

Categoría:

```text
security
data-api
architecture
```

---

## 24. Categorías físicas ampliadas recomendadas

La propuesta inicial tenía:

```text
ux-ui
design-system
code-quality
architecture
refactor
performance
accessibility
responsive
data-api
domain-business
testing
docs
```

Después de revisar los carriles que probablemente faltan, se recomienda ampliarla a:

```text
ux-ui
design-system
code-quality
architecture
refactor
performance
accessibility
responsive
data-api
domain-business
testing
security
copy-semantics
loading-skeletons
release
docs
```

Estructura ampliada:

```text
docs/ai/gaps/{module}/
  ux-ui/
  design-system/
  code-quality/
  architecture/
  refactor/
  performance/
  accessibility/
  responsive/
  data-api/
  domain-business/
  testing/
  security/
  copy-semantics/
  loading-skeletons/
  release/
  docs/
```

Esta estructura da más control para implementar por tipo de trabajo.

---

## 25. Relación entre agentes actuales y nuevos

No hay que duplicar todos los agentes actuales.

La idea es reutilizar lo que ya existe.

### 25.1 Agentes actuales a conservar

```text
code-audit-agent
ui-audit-agent
design-quality-auditor
skeleton-fidelity-auditor
gap-discovery
gap-implementor
gap-auditor
ux-reviewer
mobile-ui-agent
skeleton-implementor
frontend-developer
code-reviewer
system-learner
product-domain-agent
api-client-agent
documentation-agent
performance-frontend-agent
qa-ux-agent
```

### 25.2 Nuevos agentes/capacidades a añadir

```text
deep-audit-orchestrator
module-mapper
coverage-planner
baseline-auditor
gap-normalizer
module-registry-maintainer
implementation-batch-planner
verification-auditor
release-readiness-auditor
security-frontend-auditor
copy-semantics-auditor
state-management-auditor
business-rules-auditor
```

### 25.3 Enfoque correcto

Los agentes existentes siguen haciendo auditorías especializadas.

Los nuevos agentes no reemplazan a los actuales; los coordinan, registran, normalizan y convierten su trabajo en un sistema retomable.

---

## 26. Integración con Claude, Cursor y Codex

### 26.1 Fuente neutral

La fuente común debe ser:

```text
docs/agent-system/**
docs/ai/**
```

Claude, Cursor y Codex deben leer la misma lógica conceptual.

### 26.2 Claude Code

Claude puede tener comandos como:

```text
/deep-audit-module
/normalize-gaps
/implement-next
/verify-last
/resume-module
```

Y agentes específicos en:

```text
.claude/agents/
```

### 26.3 Codex

Codex debe tener skills equivalentes:

```text
.agents/skills/lapesquerapp-deep-audit/SKILL.md
.agents/skills/lapesquerapp-gap-normalization/SKILL.md
.agents/skills/lapesquerapp-implement-next/SKILL.md
```

Y mapping en:

```text
AGENTS.md
```

### 26.4 Cursor

Cursor debe tener reglas que apunten a la capa neutral:

```text
.cursor/rules/XX-deep-audit-module.mdc
.cursor/rules/XX-gap-v2-workflow.mdc
```

Pero no conviene duplicar todo el contenido. Cursor debe enlazar a:

```text
docs/agent-system/workflows/deep-audit-module.md
docs/agent-system/workflows/gap-normalization.md
docs/agent-system/workflows/implement-next-gap-batch.md
docs/ai/README.md
```

---

## 27. Orden de implementación recomendado

### Fase 1 — Contrato documental v2

Crear:

```text
docs/ai/README.md
docs/ai/next-action.md
docs/ai/worklog.md
docs/ai/templates/*
docs/ai/modules/orders/*
docs/ai/gaps/orders/*
docs/agent-system/workflows/deep-audit-module.md
docs/agent-system/workflows/gap-normalization.md
docs/agent-system/workflows/implement-next-gap-batch.md
```

No tocar código funcional.

No migrar GAPs legacy.

### Fase 2 — Piloto con módulo orders

Ejecutar:

```text
/deep-audit-module module=orders depth=deep
```

Objetivo:

* Probar `audit.md`.
* Probar `coverage-matrix.md`.
* Generar GAPs v2.
* Probar clasificación física.
* Probar `gaps-registry.md`.
* Probar `next-action.md`.

### Fase 3 — Normalización de GAPs

Ejecutar:

```text
/normalize-gaps module=orders
```

Objetivo:

* Deduplicar.
* Dividir.
* Marcar ready/blocked/later.
* Asignar risk/size/priority.

### Fase 4 — Implementación por categoría

Ejecutar:

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

Luego:

```text
/verify-last module=orders
```

### Fase 5 — Ajuste del sistema

Revisar:

* ¿El audit.md es útil?
* ¿El registry es cómodo?
* ¿Los GAPs están bien categorizados?
* ¿El chat recibe poco ruido?
* ¿Se puede retomar desde otro chat?
* ¿La cobertura es fiable?
* ¿La implementación por lotes funciona?

### Fase 6 — Adaptadores Claude/Cursor/Codex

Cuando el flujo esté validado:

* Crear comando Claude.
* Crear skill Codex.
* Crear regla Cursor.
* Actualizar documentación neutral.

### Fase 7 — Extensión a otros módulos

Repetir con:

```text
pallets
products
stock
customers
suppliers
production
dashboard
settings
```

---

## 28. Riesgos

### 28.1 Riesgo de duplicar fuentes de verdad

Si `docs/ai/**` nace sin una relación clara con `.claude/gaps/**`, puede haber dos sistemas paralelos.

Mitigación:

* Declarar `.claude/gaps/**` como legacy v1.
* Declarar `docs/ai/**` como canónico v2 para auditoría profunda.
* No migrar legacy al inicio.
* Usar `Legacy references` en registries.

### 28.2 Riesgo de burocracia excesiva

Si cada GAP se vuelve demasiado pesado, el sistema puede ser lento.

Mitigación:

* GAPs pequeños.
* Templates claros.
* Campos obligatorios pero no novelados.
* Registry compacto.
* Chat con resumen corto.

### 28.3 Riesgo de auditorías enormes

Si el orquestador intenta hacerlo todo en un contexto, fallará.

Mitigación:

* Dividir por carril/superficie.
* Escribir resultados en archivos.
* Devolver resúmenes mínimos.
* Usar coverage matrix.

### 28.4 Riesgo de romper Claude Code

Si se mueven `.claude/gaps/**` o comandos existentes, se rompe el sistema probado.

Mitigación:

* No mover legacy.
* Añadir capa v2.
* Migración gradual.

### 28.5 Riesgo de GAPs duplicados

Una auditoría profunda puede generar GAPs similares a los existentes.

Mitigación:

* Gap Normalizer.
* Registry por módulo.
* Legacy references.
* Baseline auditor.

### 28.6 Riesgo de contextos saturados en implementación

Implementar muchos GAPs en una sesión degrada calidad.

Mitigación:

* Implementación por lotes.
* Límite por categoría.
* Límite por risk/size.
* Verificación independiente.

---

## 29. Reglas operativas obligatorias

Estas reglas deberían aparecer en `docs/ai/README.md`, workflows y agentes:

```text
El chat no es memoria. Los archivos son memoria.

Cada módulo tiene una única auditoría canónica:
docs/ai/modules/{module}/audit.md

No crear auditorías duplicadas:
audit-v2.md
audit-final.md
audit-YYYY-MM-DD.md
deep-audit.md

Los GAPs v2 viven en:
docs/ai/gaps/{module}/{category}/

El sistema legacy .claude/gaps/** no se mueve en la fase inicial.

La historia se conserva con Git.

El orquestador debe devolver al chat solo resúmenes cortos.

Toda auditoría debe actualizar:
- audit.md
- coverage-matrix.md
- status.md
- gaps-registry.md
- next-action.md
- worklog.md

Todo GAP ready debe tener:
- categoría
- prioridad
- riesgo
- tamaño
- criterios de aceptación
- plan de validación
- archivos objetivo
- restricciones
```

---

## 30. Ejemplo de comando ideal

```text
/deep-audit-module module=orders depth=deep
```

Resultado esperado en chat:

```text
Auditoría profunda de Orders/Pedidos completada.

Cobertura:
- UX: 8/12 superficies
- UI: 9/12 superficies
- Code Quality: 7/12 superficies
- Architecture: 5/12 superficies
- Data/API: 6/12 superficies
- Responsive: 4/12 superficies
- Accessibility: 3/12 superficies

GAPs:
- 18 creados
- 12 ready
- 4 blocked
- 2 later

Archivos actualizados:
- docs/ai/modules/orders/audit.md
- docs/ai/modules/orders/coverage-matrix.md
- docs/ai/modules/orders/status.md
- docs/ai/modules/orders/gaps-registry.md
- docs/ai/next-action.md
- docs/ai/worklog.md

Siguiente acción:
/implement-next module=orders category=ux-ui limit=3 risk=low
```

El chat no debe contener toda la auditoría.

---

## 31. Ejemplo de implementación ideal

```text
/implement-next module=orders category=ux-ui limit=3 risk=low
```

Resultado esperado:

```text
Implementación por lote completada.

GAPs implementados:
- GAP-116
- GAP-117
- GAP-118

Validaciones:
- lint OK
- build OK
- revisión manual pendiente

Archivos actualizados:
- GAP files
- gaps-registry.md
- status.md
- audit.md
- worklog.md
- next-action.md

Siguiente acción:
/verify-last module=orders
```

---

## 32. Conclusión

La Pesquerapp no necesita simplemente más prompts o más agentes.

Necesita una capa operativa que convierta los agentes existentes en un sistema profesional de mejora continua.

La solución propuesta es:

```text
Crear docs/ai/** como capa v2.
Mantener .claude/gaps/** como legacy v1.
Añadir auditoría canónica por módulo.
Añadir matriz de cobertura.
Añadir registry de GAPs.
Clasificar GAPs por módulo/categoría.
Añadir normalizador/deduplicador.
Añadir next-action y worklog.
Crear orquestador de auditoría profunda.
Implementar GAPs por lotes controlados.
Verificar con agente independiente.
Extender después a Claude, Cursor y Codex.
```

El objetivo final es que el usuario no tenga que microgestionar la IA.

El usuario debería decidir solo:

```text
Qué módulo.
Qué profundidad.
Qué categoría quiere implementar.
Qué riesgo permite.
```

Y el sistema debería encargarse de:

```text
auditar
registrar
generar GAPs
normalizar
priorizar
implementar
verificar
documentar
dejar siguiente acción
```

Este es el salto de usar IA como asistente suelto a usar IA como equipo de desarrollo software asistido.
