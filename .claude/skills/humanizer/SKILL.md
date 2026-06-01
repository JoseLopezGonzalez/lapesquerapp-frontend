# Skill: Humanizer

## Categoría

Escritura

## Cuándo se activa

Cuando el usuario dice: "humaniza esto", "suena muy IA", "hazlo más natural", "menos robótico", "reescribe esto como un humano", "arregla el tono", "humanize".

También se activa cuando el usuario pide revisar textos de UI (toasts, mensajes de error, labels de botones), commit messages, PR descriptions, o documentación que suena generada.

---

## Qué hace

Toma cualquier texto y lo reescribe para que suene escrito por una persona real. Elimina los patrones de escritura típicos de IA sin perder la información técnica ni la precisión.

---

## Patrones a eliminar

```
❌ Frases de IA que delatan el origen:
- "Certainly!", "Absolutely!", "Of course!", "Great question!"
- "I'd be happy to help you with that"
- "It's worth noting that...", "It's important to mention..."
- "As an AI language model..."
- "I hope this helps!", "Feel free to ask!"
- Exceso de hedging: "might", "could potentially", "it appears that"
- Listas con 3 puntos para todo, aunque no sea necesario
- Párrafos que empiezan todos con "The" o "This"

❌ Escritura corporativa:
- "leverage", "utilize" → "use"
- "implement a solution" → "fix it" / "do it"
- "in order to" → "to"
- "at this point in time" → "now"
- "moving forward" → eliminarlo
- "please don't hesitate to reach out" → eliminarlo
```

---

## Proceso

### 1. Identificar el tipo de texto

| Tipo                                | Tono objetivo                                   |
| ----------------------------------- | ----------------------------------------------- |
| Mensaje de UI (toast, error, label) | Directo, sin jerga, en segunda persona          |
| Commit message                      | Imperativo, concreto, sin adornos               |
| PR description                      | Técnico pero conversacional                     |
| Documentación interna               | Claro, directo, como explicarías a un compañero |
| Email / comunicación                | Natural, sin formalidad innecesaria             |
| Comentario de código                | Mínimo, solo si el WHY no es obvio              |

### 2. Reescribir

- Voz activa en lugar de pasiva
- Frases cortas antes que largas
- El lector importa: ¿qué necesita saber? ¿qué puede saltarse?
- Preservar toda la información técnica — humanizar no es simplificar el contenido

### 3. Mostrar original vs. resultado

Siempre presentar los dos para que el usuario decida.

---

## Ejemplos reales del proyecto

### Toast de éxito

```
❌ "The operation has been completed successfully and the changes have been saved."
✅ "Cambios guardados."

❌ "Cliente creado correctamente en el sistema."
✅ "Cliente creado."
```

### Mensaje de error

```
❌ "An unexpected error has occurred while processing your request. Please try again later."
✅ "Algo salió mal. Inténtalo de nuevo."

❌ "The provided data failed validation. Please review the highlighted fields."
✅ "Revisa los campos marcados en rojo."
```

### Commit message

```
❌ "Implemented the functionality to allow users to filter orders by customer name in the orders management section"
✅ "Add customer name filter to orders list"
```

### Documentación

```
❌ "It is important to note that this component leverages TanStack Query to efficiently manage server state and avoid unnecessary re-renders."
✅ "Este componente usa TanStack Query para el estado del servidor — no uses useState para datos que vienen de la API."
```

---

## Output

Siempre:

1. Versión humanizada lista para copiar
2. Si hay más de una opción válida, mostrar máximo 2 alternativas
3. Una línea explicando qué se cambió y por qué (solo si no es obvio)
