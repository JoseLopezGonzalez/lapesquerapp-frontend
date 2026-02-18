# Estándar de contenido para toasts

Este documento define la visión y el estándar de **texto** (título y descripción) de las notificaciones toast en la aplicación. La implementación técnica (Sileo, wrapper, posicionamiento) se describe en [22-sileo-toast-documentation.md](./22-sileo-toast-documentation.md).

---

## Principios

1. **Título corto y contextual**  
   El título debe ser una frase breve que identifique la **acción o el resultado**, no genéricos como "Error" o "Éxito". Ejemplos: "Pedido actualizado", "Error al cargar pedidos", "Sesión cerrada".

2. **Descripción solo cuando aporte valor**  
   Si el mensaje es tan pequeño que con el título basta, **no hace falta descripción**. Si el usuario necesita más contexto, saber qué ha fallado o qué hacer a continuación, se usa `description`.

3. **Consistencia de tono**  
   Mensajes en español, claros y orientados a la acción. En errores, la descripción puede incluir la causa o la sugerencia ("Intente de nuevo", "Revisa los campos marcados").

4. **Sin punto final en el título**  
   Evitar el punto al final del título ("Pedido actualizado", no "Pedido actualizado."). En la descripción no es relevante; puede llevarlo o no según el estilo del texto.

---

## Cuándo usar solo título

- Mensajes muy breves y autoexplicativos.
- Confirmaciones simples donde el título ya dice todo.

**Ejemplos (solo título suficiente):**

- "Sesión cerrada"
- "Sin cambios"
- "Lista de cajas vaciada"
- "Documento eliminado"

En código:

```js
notify.success({ title: 'Sesión cerrada' });
notify.info({ title: 'Sin cambios' });
```

Si se quiere dar un poco más de contexto sin abusar, se puede añadir descripción; no es obligatorio en estos casos.

---

## Cuándo usar título + descripción

Usar **descripción** cuando:

- El **error** necesita explicación (qué falló, mensaje del servidor, o qué hacer).
- El **éxito** implica un detalle útil (cantidad, nombre, siguiente paso).
- La **validación** debe indicar qué corregir o qué campo falta.
- El mensaje es **técnico o largo** y conviene título corto + detalle en descripción.

**Ejemplos:**

| Contexto | Título | Descripción |
|---------|--------|-------------|
| Error al guardar | Error al actualizar pedido | No se pudieron guardar los cambios. Intente de nuevo. |
| Éxito con detalle | Fichajes registrados | Se registraron 5 fichajes correctamente. |
| Validación | Errores en el formulario | Por favor, corrige los 3 errores indicados. |
| Sesión / auth | Sesión no disponible | No hay sesión activa. Inicia sesión e inténtalo de nuevo. |
| Acción bloqueada | Caja en uso | No se puede modificar el lote de la caja #12: está siendo usada en producción. |

En código:

```js
notify.error({
  title: 'Error al actualizar pedido',
  description: 'No se pudieron guardar los cambios. Intente de nuevo.',
});

notify.success({
  title: 'Fichajes registrados',
  description: `Se registraron ${count} fichajes correctamente.`,
});

notify.error({
  title: 'Sesión no disponible',
  description: 'No hay sesión activa. Inicia sesión e inténtalo de nuevo.',
});
```

---

## Reglas prácticas

1. **Título**
   - Máximo una línea corta.
   - Sin punto final (evitar "Pedido actualizado." → "Pedido actualizado").
   - Sustantivo + contexto: "Error al…", "… guardado", "… creado", "… requerido", etc.
   - Evitar: "Error", "Éxito", "Atención" como único texto.

2. **Descripción**
   - Opcional cuando el título basta.
   - Incluir: causa del error, cantidad/nombre afectado, o acción sugerida.
   - Evitar repetir el título; la descripción debe añadir información.

3. **Promise toasts** (`notify.promise`)
   - `loading`: título breve ("Guardando…", "Creando pedido…").
   - `success`: título contextual; descripción si hay detalle (ej. "El pedido se ha creado correctamente").
   - `error`: título tipo "Error al …"; descripción con `userMessage` o mensaje amigable.

4. **Mensajes dinámicos**
   - El título puede ser fijo y la descripción llevar el detalle variable:
   - Ejemplo: `title: 'Error al procesar documento'`, `description: \`${fileName}: ${errorMessage}\``.

---

## Resumen

| Situación | Título | Descripción |
|-----------|--------|-------------|
| Mensaje muy breve y claro | Corto, contextual | No necesaria |
| Error que el usuario debe entender o actuar | Corto ("Error al …") | Sí: causa o qué hacer |
| Éxito con detalle (cantidad, nombre, etc.) | Corto ("… guardado", "… registrado") | Sí: el detalle |
| Validación / formulario | Corto ("Errores en el formulario", "Campo requerido") | Sí: qué corregir |

El wrapper de notificaciones (`notify`) acepta `NotifyMessage = string | { title: string; description?: string }`. Se recomienda usar siempre el objeto `{ title, description? }` para cumplir este estándar y omitir `description` cuando el título sea suficiente.
