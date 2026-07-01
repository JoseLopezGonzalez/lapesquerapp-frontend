# GAP-066 — Reemplazar alert() nativo en OrderLabels y Dialog→AlertDialog en OrderEditSheet

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-desktop order editor` (2026-07-01). Dos violaciones de patrones
documentados en `.claude/design-context.md`, en dos componentes distintos del editor de
pedidos.

### FND-A — `alert()` nativo en OrderLabels

`src/components/Admin/OrdersManager/Order/OrderLabels/index.js:184,215` usa el `alert()`
nativo del navegador para avisar al usuario de que no ha seleccionado ninguna línea antes de
imprimir etiquetas:

```js
const handlePrintGroupedLabels = () => {
  if (selectedGroupedLines.length === 0) {
    alert('Por favor, selecciona al menos una línea agrupada para imprimir.');
    return;
  }
  ...
};

const handlePrintIndividualLabels = () => {
  if (selectedIndividualLines.length === 0) {
    alert('Por favor, selecciona al menos una línea individual para imprimir.');
    return;
  }
  ...
};
```

design-context.md § 7 (What NOT To Do) es explícito: "Never use `alert()`... to surface
errors to the user." `alert()` bloquea el hilo de JS, usa el chrome nativo del navegador (sin
estilos de marca) y rompe el lenguaje visual del resto de la aplicación, que usa toasts Sonner
en cualquier otro punto de feedback al usuario. El archivo ni siquiera importa `notify`
todavía.

### FND-B — `Dialog` en vez de `AlertDialog` para confirmación destructiva en OrderEditSheet

`src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js:417-438` — el diálogo de
"¿Descartar cambios?" que aparece al cerrar el Sheet de edición con cambios sin guardar está
construido con `Dialog`/`DialogContent`/`DialogFooter` y botones manuales, en vez de
`AlertDialog`/`AlertDialogAction`/`AlertDialogCancel`:

```jsx
<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <DialogContent size="md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        Descartar cambios
      </DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex gap-2">
      <Button variant="outline" onClick={handleCancelDialog}>Continuar editando</Button>
      <Button variant="destructive" onClick={handleConfirmClose}>Descartar cambios</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

design-context.md § 4 Modals & Dialogs es explícito: "Destructive confirmation: **always
AlertDialog**, not Dialog", con el patrón exacto documentado (`AlertDialogTrigger` /
`AlertDialogContent` / `AlertDialogAction` / `AlertDialogCancel`). Descartar cambios sin
guardar de un pedido es exactamente ese caso — hoy funciona visualmente igual, pero usa el
componente incorrecto (semántica de accesibilidad/teclado distinta entre `Dialog` y
`AlertDialog` en Radix).

## Solución acordada

### FND-A

1. Importar `notify` desde `@/lib/notifications` en `OrderLabels/index.js`.
2. Reemplazar ambos `alert(...)` por `notify.warning({ title: '...' })` con el mismo texto
   ya existente (son recordatorios de selección, no errores del sistema).

### FND-B

Convertir el diálogo de confirmación de líneas 417-438 de `Dialog` a `AlertDialog`, siguiendo
el patrón documentado en design-context.md § Modals & Dialogs:
- `AlertDialog` (controlado con `open`/`onOpenChange`, igual que ahora)
- `AlertDialogContent` en vez de `DialogContent`
- `AlertDialogHeader` + `AlertDialogTitle` + `AlertDialogDescription`
- `AlertDialogFooter` con `AlertDialogCancel` ("Continuar editando") y `AlertDialogAction`
  ("Descartar cambios", variante destructiva)

No cambiar el texto ni el comportamiento (mismo trigger, mismos handlers
`handleCancelDialog`/`handleConfirmClose`).

## Referencias e inspiración

- design-context.md § 7 What NOT To Do: prohibición de `alert()`
- design-context.md § 4 Modals & Dialogs: patrón `AlertDialog` para confirmación destructiva
- Patrón real ya usado en el proyecto (ver ejemplo en design-context.md líneas 255-272)

## Criterios de aceptación

- [ ] `OrderLabels/index.js` no contiene ninguna llamada a `alert()`
- [ ] `handlePrintGroupedLabels` y `handlePrintIndividualLabels` muestran `notify.warning` con
      el mismo texto que tenían los `alert()` originales
- [ ] El diálogo de "Descartar cambios" en `OrderEditSheet/index.js` usa `AlertDialog` (no
      `Dialog`), con `AlertDialogAction`/`AlertDialogCancel`
- [ ] El comportamiento (abrir al cerrar con cambios sin guardar, cerrar sin guardar al
      confirmar, seguir editando al cancelar) no cambia
- [ ] `npm run type-check` pasa sin errores

## Archivos a crear o modificar

**Modificar:**
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js` — import `notify`, reemplazar 2 `alert()`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js` — `Dialog` → `AlertDialog` en el diálogo de descartar cambios

## Restricciones

- No tocar la lógica de selección de líneas en OrderLabels — solo el mecanismo de aviso
- No tocar el resto del formulario de OrderEditSheet (renderField, formGroups, etc.) — solo el diálogo de confirmación de cierre
- No convertir en AlertDialog ningún otro Dialog del archivo que no sea el de "Descartar cambios"

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación
