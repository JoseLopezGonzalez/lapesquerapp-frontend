# Skill: GAP Workflow — La PesquerApp

## Cuándo se activa este skill

Automáticamente cuando cualquiera de los tres agentes GAP está activo. Es el skill de contexto del flujo completo — su función es recordar las reglas del sistema y asegurar que los tres agentes trabajan coordinados.

---

## El flujo oficial de desarrollo de PesquerApp

Todo cambio en el proyecto — bug, mejora, feature, refactor — sigue este flujo **sin excepciones**:

```
DISCOVERY → IMPLEMENTACIÓN → AUDITORÍA
```

### Agente Discovery (`gap-discovery.md`)

- **Se activa con:** descripción de problema, mejora o feature nueva
- **Dialoga** con Jose hasta acordar la solución
- **Produce:** `GAP-NNN-nombre.md` en `.claude/gaps/open/`
- **Termina cuando:** Jose confirma el GAP

### Agente Implementador (`gap-implementor.md`)

- **Se activa con:** confirmación del GAP por Jose
- **Mueve** el GAP a `in-progress/` al empezar
- **Produce:** código implementado + GAP.md con sección Implementación rellena
- **Termina invocando** al Auditor automáticamente

### Agente Auditor (`gap-auditor.md`)

- **Se activa automáticamente** tras el Implementador
- **Produce:** GAP.md con sección Auditoría rellena + veredicto
- **Termina moviendo** el GAP a `closed/` (si aprobado) o dejándolo en `in-progress/` (si rechazado)

---

## Numeración de GAPs

Siempre correlativa. Revisar el número más alto en `open/` + `in-progress/` + `closed/` y usar el siguiente.

```
Formato: GAP-001, GAP-002, ..., GAP-099, GAP-100
Nombre de archivo: GAP-NNN-titulo-descriptivo.md
Ejemplo: GAP-007-fix-order-total-display.md
```

Si no hay ningún GAP todavía, empezar por `GAP-001`.

---

## Estados y ubicaciones

```
.claude/gaps/
├── open/           → GAP documentado y confirmado, pendiente de implementar
├── in-progress/    → Siendo implementado, o pendiente de correcciones tras rechazo
└── closed/         → Auditado y aprobado — histórico del proyecto
```

**Regla de movimiento:**

- Discovery crea el GAP en `open/`
- Implementador lo mueve a `in-progress/` al empezar
- Auditor lo mueve a `closed/` si aprueba, o lo deja en `in-progress/` si rechaza

---

## Estructura del GAP.md

Basada en `.claude/gaps/_template.md`. Campos obligatorios:

| Sección                    | Quién la rellena | Cuándo                        |
| -------------------------- | ---------------- | ----------------------------- |
| Metadata                   | Discovery        | Al crear el GAP               |
| Contexto y problema        | Discovery        | Al crear el GAP               |
| Solución acordada          | Discovery        | Al crear el GAP               |
| Criterios de aceptación    | Discovery        | Al crear el GAP               |
| Archivos a crear/modificar | Discovery        | Al crear el GAP               |
| Restricciones              | Discovery        | Al crear el GAP               |
| Implementación             | Implementador    | Al terminar la implementación |
| Auditoría                  | Auditor          | Al terminar la revisión       |

---

## Lo que nunca cambia

- **El Implementador no toca archivos fuera del GAP** sin comunicarlo a Jose primero
- **El Auditor es siempre el último paso** antes de cerrar un GAP
- **Cada GAP tiene su propio archivo** — nunca un GAP agrupa varios cambios no relacionados
- **Un GAP sin Auditoría no se cierra** — aunque Jose esté satisfecho con la implementación
- **El Auditor no modifica el código** — solo rellena la sección de Auditoría del GAP

---

## Principio rector

Un GAP bien documentado vale más que una implementación rápida. Si el Discovery hace bien su trabajo, la implementación es mecánica y la auditoría es una formalidad. Si el Discovery falla, todo el ciclo se rompe.
