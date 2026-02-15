# Bloque 9 — Log de implementación

**Estado**: Completado  
**Última actualización**: 2026-02-15

---

## Resumen

- **9.1** Tipado `src/types/punch.ts`; hooks `usePunchesList`, `usePunchesByMonth` en `src/hooks/usePunchesList.ts`; PunchesCalendar migrado a `usePunchesByMonth`.
- **9.2** Hooks `useEmployeeOptions`, `useEmployeesWithLastPunch` en `src/hooks/useEmployeesForPunches.ts`; IndividualPunchForm, TimePunchManager migrados a estos hooks.
- **9.3** Calendario ya usaba React Query (incluido en 9.1).
- **9.4** IndividualPunchForm: schema Zod `individualPunchSchema.ts`, `getDefaultTimestampValues`, useForm + zodResolver + Controller, useMutation para createManualPunch/createBulkPunches; invalidación `['punches']`.
- **9.5** TimePunchManager y NFCPunchManager: useMutation para createPunch; invalidación `['employees']`, `['punches']`.
- **9.6–9.9** BulkPunchForm y BulkPunchExcelUpload: useEmployeeOptions, useMutation para validate y create; sin cambios de UI.

## Archivos creados

- `src/types/punch.ts`
- `src/hooks/usePunchesList.ts`
- `src/hooks/useEmployeesForPunches.ts`
- `src/components/Admin/ManualPunches/individualPunchSchema.ts`

## Archivos modificados

- `src/components/Admin/ManualPunches/PunchesCalendar/index.jsx` — usePunchesByMonth
- `src/components/Admin/ManualPunches/IndividualPunchForm.jsx` — useEmployeeOptions, Zod + RHF + useMutation
- `src/components/Admin/ManualPunches/BulkPunchForm.jsx` — useEmployeeOptions, validateMutation, submitMutation
- `src/components/Admin/ManualPunches/BulkPunchExcelUpload.jsx` — useEmployeeOptions, validateMutation, submitMutation
- `src/components/Admin/TimePunch/TimePunchManager.jsx` — useEmployeesWithLastPunch, punchMutation
- `src/components/Admin/TimePunch/NFCPunchManager.jsx` — punchMutation (createPunch)

## Verificación

- Listado eventos de fichaje (EntityClient) sin cambios.
- Calendario de fichajes: carga por mes vía React Query.
- Gestión manual (individual): formulario con Zod, RHF y mutación.
- Gestor de registro horario y Fichaje NFC: lista de empleados por React Query, registro por useMutation.
- Bulk (formulario y Excel): empleados por hook, validar/registrar por useMutation.
