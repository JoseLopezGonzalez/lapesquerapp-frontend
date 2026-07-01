# GAP-049 — AlertDialog para confirmación de acciones destructivas en palés del pedido

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

`OrderPallets/dialogs/ConfirmActionDialog.jsx` es el dialog de confirmación que se usa para eliminar y desvincular palés dentro de un pedido. Está construido sobre shadcn `Dialog` en lugar de `AlertDialog`.

La regla del proyecto (documentada en `design-context.md §4` y `components.md`) es inequívoca: **todas las acciones destructivas o irreversibles deben usar `AlertDialog`**, con el par `AlertDialogCancel` + `AlertDialogAction`. El mismo problema se corrigió para etiquetas en GAP-040, pero no se auditó el módulo de palés del pedido.

La eliminación de un palé es una acción irreversible que lo desvincula del pedido. Usar `Dialog` en lugar de `AlertDialog` es una violación directa del patrón del proyecto.

Detectado en auditoría desktop `/audit-desktop orders manager` 2026-07-01.

## Solución acordada

Reemplazar el scaffolding de shadcn `Dialog` por `AlertDialog` en `ConfirmActionDialog.jsx`. Mantener la lógica de cancel/confirm existente — solo cambia el componente contenedor y sus subcomponentes.

Seguir exactamente el patrón documentado en `design-context.md §4`:
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>...</AlertDialogTitle>
      <AlertDialogDescription>...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Referencias e inspiración

- GAP-040 — mismo patrón aplicado al módulo de etiquetas
- `design-context.md §4 Modals & Dialogs` — AlertDialog para destructive confirmation ONLY
- `src/components/ui/alert-dialog.tsx` — componente ya disponible en el proyecto

## Criterios de aceptación

- [ ] `ConfirmActionDialog.jsx` usa `AlertDialog` en lugar de `Dialog`
- [ ] Los subcomponentes (`AlertDialogContent`, `AlertDialogHeader`, etc.) sustituyen a los equivalentes de `Dialog`
- [ ] La lógica de confirmación (`onConfirm` callback) funciona igual que antes
- [ ] El botón de cancelar usa `AlertDialogCancel`
- [ ] El botón de confirmar usa `AlertDialogAction`
- [ ] No hay regresión en el flujo de eliminar palé ni de desvincular palé

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.jsx`

## Restricciones

- No tocar la lógica de negocio de eliminación/desvinculación de palés
- No modificar `OrderPallets/index.js` ni otros dialogs del módulo
- No migrar a `.tsx` en este GAP (puede hacerse en un GAP de migración JS→TS posterior)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPallets/dialogs/ConfirmActionDialog.jsx` — reemplazado scaffolding `Dialog` por `AlertDialog`; `description` movida a `AlertDialogDescription`; botón cancelar usa `AlertDialogCancel`; botón confirmar usa `AlertDialogAction` con prop `variant` (destructive/default); se mantiene el estado de carga `isUnlinking` con `Loader2` dentro del `AlertDialogAction`.

### Decisiones tomadas durante la implementación

`AlertDialogContent` del proyecto ya soporta `size` prop. Se usa la talla por defecto (sin `size="md"`) ya que "md" no es un valor documentado en el componente. `AlertDialogAction` acepta `variant` en este proyecto (renderiza internamente un `Button asChild`), lo que permite aplicar `variant="destructive"` directamente sin clases manuales. `onOpenChange={onCancel}` preserva el comportamiento existente del padre (`if (!open) handleCancelAction()`).

### Desviaciones del plan (si las hay)

Ninguna.

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
