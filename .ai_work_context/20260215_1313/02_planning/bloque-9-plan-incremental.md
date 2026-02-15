# Bloque 9 — Fichajes / Gestión horaria — Plan incremental

**Estado**: Propuesta  
**Última actualización**: 2026-02-15

---

## Criterios del plan

- Bloques **reversibles** y con **plan de verificación**.
- **Sin cambios de UI/UX** (layout, colores, textos, flujos) salvo correcciones de accesibilidad/responsive.
- **Aprobación explícita** antes de aplicar cada bloque.
- Prioridad: **React Query** y **tipado** en servicios/hooks; después **reducción de tamaño** de componentes (extracción de hooks/subcomponentes).

---

## Secuencia propuesta

### Bloque 9.1 — Servicio de punches en TypeScript y hooks React Query (lista y calendario)

**Objetivo**: Tipar las funciones de `punchService.js` usadas por listado y calendario, y exponerlas vía React Query sin cambiar UI.

**Incluye**:
- Crear `src/services/punches/punchService.ts` (o `punchService.types.ts` + migración gradual) con tipos para Punch, listado paginado, filtros.
- Añadir hooks `usePunchesList` y `usePunchesByMonth` que usen `useQuery` con `queryKey` tenant-aware.
- Mantener `punchService.js` existente como fachada que reexporte o que los nuevos hooks llamen a funciones que sigan en .js temporalmente (para no romper llamadas directas).
- **No** modificar aún componentes; solo añadir hooks y tipos. Opcional: que PunchesCalendar use `usePunchesByMonth` en un cambio mínimo (sustituir useEffect por hook).

**Verificación**: Listado de eventos de fichaje (EntityClient) sigue funcionando; calendario carga el mes; no hay regresión visual ni de flujo.

**Reversible**: Sí (quitar hooks y volver a llamadas directas en componentes).

---

### Bloque 9.2 — React Query para empleados en Gestión Horaria

**Objetivo**: Que todos los componentes que cargan lista de empleados usen React Query (tenant-aware).

**Incluye**:
- Hook `useEmployeesForPunches` (o `useEmployeeOptions`) que use `useQuery` llamando a `employeeService.getOptions()` o a `getEmployees` con parámetros adecuados.
- Sustituir en **IndividualPunchForm**, **TimePunchManager** y **NFCPunchManager** el `useEffect` + `setEmployeeOptions`/`setEmployees` por el nuevo hook.
- Incluir `tenantId` en queryKey.

**Verificación**: Gestión manual (individual), Gestor de registro horario y Fichaje NFC siguen mostrando y usando la lista de empleados correctamente.

**Reversible**: Sí.

---

### Bloque 9.3 — Calendario de fichajes 100% React Query

**Objetivo**: PunchesCalendar sin useEffect para datos; uso de `usePunchesByMonth` y estados derivados del hook.

**Incluye**:
- Sustituir en `PunchesCalendar/index.jsx` el estado `punchesData` + `useEffect(getPunchesByMonth)` por `usePunchesByMonth(year, month)`.
- Mantener UI idéntica (loading/error desde el hook).

**Verificación**: Navegación por meses, resumen por día y apertura de PunchDayDialog sin regresiones.

**Reversible**: Sí.

---

### Bloque 9.4 — IndividualPunchForm: Zod + react-hook-form y mutación React Query

**Objetivo**: Formulario individual con validación Zod, react-hook-form y `useMutation` para crear fichaje; opcionalmente usar hook de empleados ya existente.

**Incluye**:
- Schema Zod para formulario (empleado, tipo evento, timestamp, y si aplica exitTimestamp).
- `useForm` con `zodResolver(schema)`.
- `useMutation` para `createManualPunch`; onSuccess invalidar queries de punches/calendario si se desea.
- Sin cambio de textos ni disposición de campos (solo mejora técnica).

**Verificación**: Crear un fichaje individual manual y comprobar validación y mensajes actuales.

**Reversible**: Sí.

---

### Bloque 9.5 — TimePunchManager y NFCPunchManager: React Query para empleados + useMutation para createPunch

**Objetivo**: Usar hook de empleados (Bloque 9.2) y mutación para `createPunch`; eliminar useEffect de carga.

**Incluye**:
- Sustituir carga de empleados por hook (ya hecho en 9.2 si se aplica antes).
- `useMutation` para el registro de fichaje; en onSuccess se puede invalidar lista de empleados (with_last_punch) y/o punches del dashboard.
- Mantener flujo e interacción actual (botones, diálogos, mensajes).

**Verificación**: Registrar entrada/salida en TimePunchManager y en NFC; comprobar que la lista se actualiza si se invalida.

**Reversible**: Sí.

---

### Bloque 9.6 — Reducción de tamaño: IndividualPunchForm

**Objetivo**: Bajar de ~450 líneas; extraer lógica a custom hook y subcomponentes (sin cambiar UX).

**Incluye**:
- Extraer `useIndividualPunchForm` (estado, validación, submit) si no se hizo en 9.4.
- Extraer subcomponentes (por ejemplo sección de empleado, sección de fechas, botones) en archivos bajo `ManualPunches/`.
- Mantener mismo layout y mensajes.

**Verificación**: Misma funcionalidad y apariencia.

**Reversible**: Sí (revertir extracciones).

---

### Bloque 9.7 — Reducción de tamaño: PunchesCalendar y PunchDayDialog

**Objetivo**: Componentes por debajo de 200 líneas; extraer lógica a hook y subcomponentes.

**Incluye**:
- `usePunchesCalendar(year, month)` que encapsule `usePunchesByMonth` y lógica de día seleccionado/datos por día.
- Subcomponentes para cabecera del calendario, rejilla de días, celda de día.
- PunchDayDialog: extraer lista de fichajes por empleado a subcomponente o hook.

**Verificación**: Calendario y diálogo se comportan igual.

**Reversible**: Sí.

---

### Bloque 9.8 — Reducción de tamaño: BulkPunchForm y BulkPunchExcelUpload

**Objetivo**: Bajar líneas de BulkPunchForm y BulkPunchExcelUpload; extraer hooks (validar/enviar) y subcomponentes (tabla de filas, cabecera, ayuda).

**Incluye**:
- Hooks `useBulkPunchForm` y `useBulkPunchExcel` para estado de filas, validación y envío (con useMutation).
- Subcomponentes para tabla, fila de fichaje, bloque de ayuda, botones.
- Sin cambio de flujo ni textos.

**Verificación**: Validar y registrar masivo (formulario y Excel) igual que antes.

**Reversible**: Sí.

---

### Bloque 9.9 — Reducción de tamaño: TimePunchManager y NFCPunchManager

**Objetivo**: Llevar ambos por debajo de 200 líneas; extraer lógica a hooks y subcomponentes.

**Incluye**:
- Hook `useTimePunchRegistration` (empleados, registeringId, handleRegisterPunch, lastSuccess).
- Subcomponentes para lista de empleados, tarjeta de empleado, diálogo de confirmación/éxito.
- Mismo enfoque para NFCPunchManager (hook + subcomponentes).

**Verificación**: Flujo de fichaje manual y NFC intacto.

**Reversible**: Sí.

---

### Bloque 9.10 — Unificación y limpieza de servicios (opcional/final)

**Objetivo**: Un solo punto de uso para “punches” en el front: o bien un único `punchService` en TS que reemplace el legacy, o documentar qué usa EntityClient (domain) y qué usa el resto (nuevo servicio tipado), y deprecar llamadas directas a `punchService.js` desde componentes (que pasen a usar solo hooks).

**Incluye**:
- Decisión: mantener `domain/punches/punchService.js` para EntityClient y migrar el resto a `punchService.ts` + hooks, o unificar en un solo servicio TS.
- Documentar en 01_analysis o en código.
- No romper EntityClient ni formularios actuales.

**Verificación**: Todas las pantallas del bloque 9 funcionan; no hay llamadas directas a `punchService.js` desde componentes (solo desde hooks o servicio unificado).

**Reversible**: Con cuidado (revertir migración de llamadas).

---

## Orden recomendado para esta sesión

1. **9.1** — Tipado y hooks React Query (punches list + by month). Base para calendario y consistencia.
2. **9.2** — React Query para empleados en todo el bloque.
3. **9.3** — Calendario 100% React Query.

Con esto el bloque queda con data fetching moderno y estable. Los siguientes (9.4–9.10) se pueden abordar en la misma sesión o en la siguiente según prioridad.

---

## Matriz de validación (resumen)

| Bloque | Cambio principal | Riesgo UI | Reversible |
|--------|------------------|-----------|------------|
| 9.1 | Tipos + hooks usePunchesList / usePunchesByMonth | Bajo | Sí |
| 9.2 | Hook useEmployeeOptions / useEmployeesForPunches | Bajo | Sí |
| 9.3 | PunchesCalendar usa usePunchesByMonth | Bajo | Sí |
| 9.4 | IndividualPunchForm Zod + RHF + useMutation | Bajo | Sí |
| 9.5 | TimePunch + NFC con hook empleados + useMutation | Bajo | Sí |
| 9.6–9.9 | Extracción hooks/subcomponentes | Bajo | Sí |
| 9.10 | Unificación/limpieza servicios | Medio | Con cuidado |
