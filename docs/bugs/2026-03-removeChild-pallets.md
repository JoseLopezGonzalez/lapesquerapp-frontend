## Bug: Error `removeChild` al gestionar palets / posiciones

**Fecha**: 2026-03-16  
**Estado**: En análisis (con hipótesis sólida)  
**Contexto**: Reportado por usuario externo (Portugal) al crear o posicionar un palet.

---

### 1. Descripción del error

- **Mensaje (browser)**:  
  `Falhou ao executar 'removeChild' em 'Node': O nó a ser removido não é filho desse nó`

- **Traducción**:  
  _"Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."_

- **Impacto**:
  - Error aparece de forma **intermitente**.
  - Detectado en al menos un **usuario externo** conectado desde Portugal.
  - Ocurre durante flujos de **creación o posicionamiento de palets**, con alta probabilidad ligado a acciones de **impresión de etiqueta** o **medición/edición de etiquetas**.

---

### 2. Análisis técnico

El mensaje es un error estándar del DOM que se lanza cuando se llama a:

- `parent.removeChild(child)`  
  y `child` **ya no es hijo** de `parent` (o nunca lo fue).

En el código del proyecto se han encontrado varios usos de `removeChild` y `.remove()`; los relevantes para palets/posiciones son:

1. **Impresión genérica de elementos** (incluida etiqueta de palet)

```3:80:src/hooks/usePrintElement.js
export function usePrintElement({ id, width = 100, height = 150, freeSize = false }) {
  const onPrint = useCallback(() => {
    const elementToPrint = document.getElementById(id);
    if (!elementToPrint) return;

    const iframe = document.createElement("iframe");
    ...
    document.body.appendChild(iframe);
    ...
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 500);
  }, [id, width, height, freeSize]);

  return { onPrint };
}
```

- `usePrintElement` se usa, entre otros, en la vista de palet:

```118:123:src/components/Admin/Pallets/PalletDialog/PalletView/index.js
const { onPrint } = usePrintElement({ id: 'print-area-id', width: PALLET_LABEL_SIZE.width, height: PALLET_LABEL_SIZE.height });

const handleOnClickPrintLabel = () => {
  onPrint();
}
```

2. **Editor de etiquetas** (medición automática de contenido)

```1040:1097:src/hooks/useLabelEditor.ts
...
document.body.appendChild(tempContainer);
...
const rect = tempElement.getBoundingClientRect();
...
document.body.removeChild(tempContainer);
...
} catch (error) {
  console.error('Error al ajustar tamaño:', error);
  if (document.body.contains(tempContainer)) {
    document.body.removeChild(tempContainer);
  }
}
```

En ambos casos se sigue el mismo patrón:

- Se **inyecta** un nodo temporal en `document.body` (`iframe` o `tempContainer`).
- Se hacen operaciones **asíncronas** (`setTimeout`, mediciones, etc.).
- Finalmente se llama a `document.body.removeChild(...)` sin comprobar si el nodo sigue siendo realmente hijo de `document.body`.

Esto abre una **condición de carrera**:

- Si el usuario **cambia de pantalla**, cierra el diálogo, o la app desmonta el árbol React (por navegación, logout, cambio de rol, etc.) entre la inserción del nodo y el `setTimeout` que hace el `removeChild`, es posible que:
  - El nodo ya haya sido eliminado por otro camino, o
  - El navegador haya limpiado el contenido asociado (por ejemplo, al destruir el iframe o el documento embebido).
- En ese momento, la variable local (`iframe` / `tempContainer`) sigue existiendo, pero **el nodo ya no es hijo de `document.body`** → la llamada a `document.body.removeChild(...)` lanza exactamente el error observado.

Que el error solo se haya observado de momento en un **usuario externo** (Portugal) encaja con:

- Flujos ligeramente distintos (permisos, rutas, diálogos) o tiempos de navegación diferentes.
- **Latencia** y tiempos de respuesta de red distintos que hacen que el `setTimeout` coincida justo con un desmontaje o un cambio de página.
- Mensaje del navegador en portugués (idioma/config de navegador del usuario), no del código de la app.

---

### 3. Hipótesis principal de causa

**Hipótesis**:  
El error se debe a que se intenta eliminar del DOM (`document.body.removeChild(...)`) un nodo temporal (`iframe` de impresión o `tempContainer` de medición) que **ya ha sido eliminado** o **ya no es hijo de `document.body`** cuando se ejecuta el callback asíncrono.

**Escenario típico** (impresión de etiqueta de palet):

1. Usuario crea/posiciona un palet y abre la vista de palet.
2. Pulsa **"Imprimir etiqueta"**, lo que dispara `usePrintElement.onPrint`.
3. Se crea un `iframe` oculto, se añade a `document.body` y se lanza un `setTimeout` para `print()` y después otro `setTimeout` para limpiar con `document.body.removeChild(iframe)`.
4. Antes de que se ejecute el segundo `setTimeout`, el usuario:
   - cierra el diálogo de palet, o
   - navega a otra pantalla, o
   - la app desmonta el árbol por cambios de sesión/rol.
5. Como consecuencia, el `iframe` puede haber sido limpiado/invalidado; al ejecutarse el `setTimeout`, `document.body.removeChild(iframe)` falla con:
   - `Falhou ao executar 'removeChild' em 'Node': O nó a ser removido não é filho desse nó`.

Escenario análogo puede darse en `useLabelEditor` con el `tempContainer` usado para medir contenido antes de ajustar tamaño.

---

### 4. Propuesta de mitigación (cambios sugeridos)

> Nota: esta sección describe la **solución propuesta**; no implica que ya esté implementada.

Para eliminar la condición de carrera y evitar el error de DOM:

1. **Validar que el nodo sigue siendo hijo de `document.body` antes de llamara `removeChild`**.

Ejemplo conceptual en `usePrintElement`:

```javascript
// Antes:
document.body.removeChild(iframe);

// Después (propuesto):
if (iframe && iframe.parentNode === document.body) {
  document.body.removeChild(iframe);
}
```

Ejemplo conceptual en `useLabelEditor`:

```javascript
// Antes:
document.body.removeChild(tempContainer);

// Después (propuesto):
if (tempContainer && document.body.contains(tempContainer)) {
  document.body.removeChild(tempContainer);
}
```

2. **Opcional**: cancelar `setTimeout` si el componente se desmonta.

- En los hooks que usan `setTimeout`, se podría guardar los IDs de timeout y limpiarlos en el `cleanup` de un `useEffect`, evitando que callbacks corran después del unmount.
- Esto añade una segunda capa de protección, especialmente útil cuando hay muchos cambios de pantalla rápidos.

---

### 5. Próximos pasos recomendados

1. **Confirmar stack trace**:
   - Reproducir el error (idealmente en el entorno del usuario externo) y capturar el stack completo en la consola.
   - Verificar que apunta a `usePrintElement` y/o `useLabelEditor`.
2. **Implementar las validaciones previas a `removeChild`** en ambos hooks.
3. **Re-test**:
   - Repetir el flujo de creación/posicionamiento de palet e impresión de etiqueta.
   - Probar cambios rápidos de pantalla justo después de pulsar "Imprimir" para asegurar que no se lanza el error.
4. **Documentar** en guías internas:
   - Evitar `removeChild` sin comprobación previa en callbacks asíncronos.
   - Preferir limpieza defensiva cuando se tocan nodos del DOM fuera del ciclo normal de React.
