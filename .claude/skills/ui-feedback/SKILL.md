# Skill: UI Feedback Capture
**Trigger:** Activar cuando Jose rechaza o critica una implementación de UI después de revisarla.

## Propósito

Convertir el feedback visual de Jose en reglas permanentes de diseño. Cada rechazo enseña algo al sistema. Esta skill garantiza que ese aprendizaje quede capturado y nunca se pierda.

---

## Protocolo

### Paso 1 — Capturar

Preguntar a Jose (o extraer de su mensaje) lo siguiente:
- ¿Qué es exactamente lo que está mal? (layout / color / elección de componente / spacing / comportamiento / otro)
- ¿Cómo debería verse lo correcto? (describir o apuntar a una referencia)
- ¿Es una corrección puntual o una regla que debe aplicarse siempre?

### Paso 2 — Traducir

Convertir el feedback en una regla concreta y accionable. Ejemplos:
- "Esto se ve muy pesado" → "Las cards en vistas de listado no tienen sombra — solo un borde de 1px con `--color-border`"
- "El modal es demasiado ancho" → "Los modales de confirmación usan `size='md'` (max-w-md); los de entrada de datos usan `size='lg'`; nunca `xl` o más ancho para formularios simples"
- "El estado vacío queda mal" → "Los estados vacíos siempre incluyen un icono de lucide-react, un título y un único botón de acción — nunca solo texto"
- "No uses esos colores" → "No usar clases de color Tailwind sin semántica (`text-gray-500`) — siempre usar `text-muted-foreground` o la variable CSS equivalente"

### Paso 3 — Proponer

Presentar la regla traducida a Jose para confirmación:

```
FEEDBACK CAPTURADO
─────────────────
Feedback original: [palabras exactas de Jose]
Regla traducida: [regla concreta]
Sección en design-context.md: [nombre de la sección donde iría]
¿Confirmas añadir esta regla? sí / no / modificar
```

### Paso 4 — Persistir

Si Jose confirma, añadir la regla a la sección correspondiente de `.claude/design-context.md`:
- Añadir en la sección `## 7. What NOT To Do` si es una prohibición
- Añadir en la sección temática correspondiente (Tables, Forms, Cards, etc.) si es un patrón
- Añadir en `## 8. UX Principles Inferred` si es un principio de UX
- Anotar la fecha y el GAP de origen en un comentario inline en el archivo: `<!-- Añadido: 2026-XX-XX — GAP-NNN -->`

### Paso 5 — Backfill (opcional)

Si la regla revela que GAPs cerrados existentes contienen el mismo patrón incorrecto, señalarlo — no corregir automáticamente:

```
⚠️ BACKFILL NECESARIO
Esta regla afecta a implementaciones previas:
- GAP-NNN: [archivo:línea] — [descripción del problema]
¿Quieres abrir un GAP de corrección para estos casos?
```

---

## Output Format

```
FEEDBACK CAPTURADO
─────────────────
Feedback original: [palabras exactas de Jose]
Regla traducida: [regla concreta y accionable]
Sección en design-context.md: [nombre de sección]
Estado: pendiente de confirmación / confirmado / rechazado
```

---

## Lo que NO hacer

- No añadir reglas a design-context.md sin confirmación explícita de Jose
- No modificar código de producción como parte de este skill — solo design-context.md
- No inventar reglas adicionales "de paso" cuando se captura un feedback — una regla por feedback
- No eliminar reglas existentes sin motivo — solo añadir o precisar
