---
name: implement-next
description: >
  Selects and implements the next eligible La PesquerApp GAPs for a module using the established GAP workflow.
---

# Skill: Implement Next — La PesquerApp

## Cuándo se activa

Cuando Jose escribe `/implement-next module={module} category={category} limit={n} risk={risk}` o pide en lenguaje natural "implementa los próximos GAPs de {módulo}".

Ejecutado por **el hilo principal**. La selección de GAPs es un filtro determinista (no requiere un agente); la implementación de cada GAP usa el flujo ya existente (`gap-implementor`); la verificación final usa `gap-auditor` en modo lote, como subagente con contexto limpio.

Diseño completo: `.claude/propuesta-nueva-estructura-ia.md` §16. Contrato de archivos: `docs/ai/README.md`.

---

## Parámetros

```text
module    obligatorio — slug del módulo (p. ej. orders)
category  obligatorio — una de: ux-ui, code-quality, architecture-refactor,
          data-api, domain-business, a11y-responsive
limit     opcional, default 3 — máximo de GAPs a implementar en esta pasada
risk      opcional, default low — máximo riesgo admitido: low | medium | high
```

---

## Fase 1 — Selección (determinista, sin agente)

Leer `docs/ai/modules/{module}/gaps-registry.md` (sección Ready) y filtrar:

```text
status == ready
AND category == {category}
AND risk <= {risk}          (low < medium < high)
AND size in (XS, S, M)      (L/XL nunca por defecto, salvo que Jose lo autorice explícitamente)
AND dependencies vacío, o todas sus dependencias ya en status=done
```

Tomar como máximo `{limit}` GAPs, ordenados por prioridad (P0 primero).

Si no hay ningún GAP que cumpla el filtro: decirlo a Jose con el motivo (p. ej. "no hay GAPs ready de category=ux-ui con risk<=low; hay 2 en blocked por dependencias") y no continuar.

---

## Fase 2 — Implementación uno por uno

Para cada GAP seleccionado, seguir el flujo ya existente del `gap-implementor` (leer el GAP completo, implementar exactamente lo descrito, sin abrir temas nuevos). Reglas específicas de este skill:

```text
No auditar de nuevo el módulo — la auditoría ya está hecha, este skill implementa.
No abrir temas nuevos fuera del GAP.
No mezclar categorías distintas a la pedida, salvo permiso explícito de Jose.
No tocar backend si el GAP no lo permite explícitamente.
No añadir dependencias npm sin aprobación.
No cambiar contratos de datos sin aprobación.
Implementar los GAPs de uno en uno, no en paralelo — cada implementación puede
revelar que la siguiente necesita ajustarse.
Actualizar el frontmatter status del GAP (in_progress → done/blocked) al terminar
cada uno.
```

Tras cada GAP, ejecutar las validaciones básicas antes de pasar al siguiente: `npm run lint`, `npm run type-check`. `npm run build` solo al final del lote completo (es más caro).

---

## Fase 3 — Verificación con contexto limpio

Al terminar el lote (o si uno de los GAPs falla las validaciones básicas y no puede corregirse trivialmente), invocar al subagente `gap-auditor` en **modo lote**: pasarle la lista de GAPs implementados en esta pasada y las rutas de sus archivos. El auditor debe correr con contexto limpio (subagente real, no continuación del hilo que implementó) para no heredar el sesgo de quien implementó.

El auditor revisa cada GAP contra sus criterios de aceptación y el checklist técnico/visual/UX habitual (ver `.claude/agents/gap-auditor.md`), y devuelve done / needs_fix / blocked / rejected por cada uno.

---

## Fase 4 — Actualizar estado

- Frontmatter de cada GAP implementado (`status`, `updated_at`)
- Regenerar registry: `node scripts/build-gaps-registry.mjs {module}`
- `docs/ai/modules/{module}/audit.md` § Estado del módulo, § GAPs resueltos
- `docs/ai/next-action.md` (global)
- `docs/ai/worklog.md` (una fila nueva)

---

## Fase 5 — Resumen al chat

Devolver solo:

```text
- GAPs implementados (con su id) y su veredicto de verificación
- GAPs bloqueados o rechazados y por qué
- validaciones ejecutadas (lint, type-check, build) y resultado
- archivos modificados
- siguiente acción sugerida (siguiente lote, u otra categoría)
```

---

## Reglas

```text
Solo coger GAPs ready, con el riesgo/tamaño permitido por los parámetros.
No auditar de nuevo — eso es responsabilidad de /deep-audit-module.
La verificación final siempre pasa por gap-auditor con contexto limpio,
nunca se auto-verifica el mismo hilo que implementó.
No editar gaps-registry.md a mano — regenerar con el script.
Recordar a Jose el punto de commit al finalizar el lote (Claude no commitea
por su cuenta en contexto LOCAL).
```
