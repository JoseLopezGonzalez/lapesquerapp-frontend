# Skill: Token Optimizer

## Categoría

Optimización de tokens

## Cuándo se activa

Cuando el usuario dice: "optimiza el contexto", "demasiados tokens", "token optimizer", "reduce el contexto", "el prompt es muy largo", "cómo recorto esto", "optimize tokens", "context too long", "slim this down", "qué puedo quitar".

---

## Qué hace

Analiza un prompt, conversación o bloque de contexto y produce una **estrategia documentada** para reducir los tokens sin perder información esencial. A diferencia de Caveman (que comprime todo sin discriminar), Token Optimizer razona sobre qué cortar y por qué.

---

## Diferencia con Caveman

|           | Caveman                  | Token Optimizer                   |
| --------- | ------------------------ | --------------------------------- |
| Enfoque   | Comprime sin pensar      | Analiza antes de cortar           |
| Output    | Texto comprimido directo | Estrategia + versión optimizada   |
| Cuándo    | "Hazlo más corto"        | "Ayúdame a reducir este contexto" |
| Resultado | Máxima compresión        | Compresión inteligente            |

---

## Proceso

### 1. Auditoría del contexto

Clasificar cada sección del input en una de estas categorías:

```
🔴 ELIMINAR — No aporta nada al objetivo actual
🟡 COMPRIMIR — Contiene información útil pero se puede resumir
🟢 MANTENER — Esencial, no tocar
🔵 REFERENCIAR — Mover a un archivo externo y referenciar
```

### 2. Identificar patrones de desperdicio

```
Redundancias:
- Información repetida en varios lugares
- Ejemplos que ilustran lo mismo varias veces
- Contexto histórico que ya no aplica

Exceso de ejemplos:
- ¿Necesitas 5 ejemplos o con 2 es suficiente?
- ¿Los ejemplos negativos (❌) son tan largos como los positivos (✅)?

Imports y boilerplate:
- ¿Hay bloques de código con imports completos que no son relevantes?
- ¿Se puede reemplazar un bloque de código por una descripción de 1 línea?

Contexto implícito:
- ¿Hay información que el modelo ya sabe? (APIs conocidas, patrones estándar)
- ¿Se está explicando algo que está en un archivo al que se puede hacer referencia?
```

### 3. Estrategia por tipo de contenido

**Para prompts de desarrollo:**

```
- Eliminar: descripciones de lo que YA está hecho
- Comprimir: contexto de arquitectura → 3 bullets máximo
- Mantener: restricciones, criterios de aceptación, archivos exactos
- Referenciar: reglas largas → "ver .claude/rules/hooks.md"
```

**Para contexto de CLAUDE.md / reglas:**

```
- Eliminar: ejemplos que duplican la misma regla
- Comprimir: secciones de "qué no hacer" → lista corta
- Mantener: ejemplos ✅ con código real del proyecto
- Referenciar: patrones generales → "ver .claude/rules/typescript.md"
```

**Para conversaciones largas:**

```
- Eliminar: saludos, confirmaciones, "gracias"
- Comprimir: el hilo de razonamiento → solo las conclusiones
- Mantener: decisiones tomadas, restricciones acordadas, archivos listados
```

### 4. Producir el output

---

## Formato de output

```
## Auditoría de tokens

**Tokens estimados (input):** ~X
**Tokens estimados (output optimizado):** ~Y
**Reducción:** Z%

### Lo que se puede eliminar 🔴
- [Sección/párrafo] — motivo

### Lo que se puede comprimir 🟡
- [Sección] → [versión comprimida propuesta]

### Lo que se debe mantener 🟢
- [Sección] — por qué es esencial

### Lo que se puede referenciar 🔵
- [Sección] → "ver [ruta del archivo]"

---

## Versión optimizada

[El texto/prompt completo con todas las optimizaciones aplicadas]
```

---

## Ejemplo aplicado al proyecto

**Input:** Un prompt de 800 tokens que pide implementar un filtro en el módulo de pedidos, con todo el contexto de arquitectura repetido.

**Análisis:**

- 🔴 Eliminar: la descripción de cómo funciona fetchWithTenant (está en las reglas)
- 🔴 Eliminar: los ejemplos negativos del patrón de hooks (con el positivo es suficiente)
- 🟡 Comprimir: "el proyecto usa Next.js 16 con App Router, React 19-rc canary, TypeScript strict..." → "Stack: Next.js 16, React 19-rc, TS strict. Ver CLAUDE.md."
- 🟢 Mantener: "el filtro debe estar en `useOrdersList.ts`, añadir el param `salesperson_id` al endpoint"
- 🔵 Referenciar: el bloque de código del patrón de hook → "seguir patrón de `.claude/rules/hooks.md`"

**Resultado:** De 800 tokens a ~200 tokens. El implementador tiene todo lo que necesita.
