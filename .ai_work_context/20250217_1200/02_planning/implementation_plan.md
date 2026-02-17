# Plan de implementación — Crear salidas de cebo (frontend)

**Estado**: Aprobado  
**Última actualización**: 2025-02-17

## Orden de ejecución

1. **Config** — `entitiesConfig.js`: `hideCreateButton: false`, `createRedirect: "/admin/cebo-dispatches/create"`.
2. **Página create** — `src/app/admin/cebo-dispatches/create/page.js`: sesión, `isOperario`, operario sin Card (estado éxito/formulario), otros con Card.
3. **Hook operario cebo** — `useOperarioCeboForm.js`: basado en `useOperarioReceptionForm`, llamada a `ceboDispatchService.create`; en `goNext` **no** ejecutar rama `someLinesWithoutBoxes` / `notify.action`.
4. **Formulario operario cebo** — `OperarioCreateCeboForm`: basado en OperarioCreateReceptionForm, títulos "Nueva salida de cebo", usar hook cebo.
5. **Hook admin cebo** — `useAdminCeboForm.js`: solo modo líneas (sin palets), `validateReceptionDetails` + `transformDetailsToApiFormat`, `ceboDispatchService.create`.
6. **Formulario admin cebo** — `CreateCeboForm`: basado en CreateReceptionForm sin Tabs ni PalletDialog; solo tabla de líneas.
7. **Pantalla éxito operario** — `CeboSuccessActions`: estado `createdDispatch`, botones "Nueva salida" y "Volver al inicio".
8. **Timeline y reporte** — 04_logs, 05_outputs/FINAL_REPORT.md, borrar 00_working.

## Matriz de validación

| Requisito | Cómo validar |
|-----------|--------------|
| Operario: no aviso "Algunas líneas no tienen cajas" | Hook `useOperarioCeboForm` no contiene `notify.action` por líneas sin cajas. |
| Otros roles: solo líneas, sin palets | CreateCeboForm sin Tabs ni PalletDialog; useAdminCeboForm sin `mode === 'manual'`. |
| Payload create solo details | Ambos hooks envían `{ supplier, date, notes, details }` a `ceboDispatchService.create`. |
| Botón crear visible en listado cebo | entitiesConfig `hideCreateButton: false` y createRedirect definido. |
