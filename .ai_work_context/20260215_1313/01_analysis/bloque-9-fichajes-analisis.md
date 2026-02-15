# Bloque 9 — Fichajes / Gestión horaria — Análisis

**Estado**: En curso  
**Última actualización**: 2026-02-15

---

## 1. Alcance del bloque

Según `docs/00_CORE CONSOLIDATION PLAN — ERP SaaS (Next.js + Laravel).md`:

- **Empleados** (`/admin/employees`) — entidad genérica EntityClient
- **Eventos de Fichaje** (`/admin/punches`) — entidad genérica EntityClient
- **Gestión Manual de Fichajes** (`/admin/manual-punches`) — módulo propio (Individual, Masivo formulario, Masivo Excel)
- **Calendario de Fichajes** (`/admin/punches-calendar`) — calendario por mes
- **Gestor de Registro Horario** (`/admin/time-punch-manager`) — fichaje rápido por empleado
- **Fichaje Automático NFC** (`/admin/nfc-punch-manager`) — registro por NFC

---

## 2. Inventario de archivos

### Rutas (App Router)

| Ruta | Archivo page | Componente principal |
|------|--------------|----------------------|
| `/admin/employees` | `admin/[entity]/page.js` (entity=employees) | EntityClient |
| `/admin/punches` | `admin/[entity]/page.js` (entity=punches) | EntityClient |
| `/admin/manual-punches` | `admin/manual-punches/page.js` | ManualPunchesManager |
| `/admin/punches-calendar` | `admin/punches-calendar/page.js` | PunchesCalendar |
| `/admin/time-punch-manager` | `admin/time-punch-manager/page.js` | TimePunchManager |
| `/admin/nfc-punch-manager` | `admin/nfc-punch-manager/page.js` | NFCPunchManager |

### Servicios

| Archivo | Líneas | Uso | Notas |
|---------|--------|-----|-------|
| `src/services/punchService.js` | ~844 | Dashboard, ManualPunches, Calendar, TimePunch, NFC | Legacy; todas las funciones de fichajes (getPunches, createPunch, createManualPunch, createBulkPunches, getPunchesByMonth, getPunchesDashboard, getPunchesStatistics, etc.) |
| `src/services/domain/punches/punchService.js` | ~91 | EntityClient para punches (list/get/create/update/delete) | Genérico, usa generic entityService |
| `src/services/employeeService.js` | ~222 | TimePunchManager, posiblemente otros | Legacy getEmployees, getEmployee, etc. |
| `src/services/domain/employees/employeeService.js` | ~211 | IndividualPunchForm (getOptions), EntityClient employees | list, getById, getOptions, etc. |

### Hooks

| Archivo | Uso | Patrón |
|---------|-----|--------|
| `src/hooks/usePunches.js` | Dashboard (WorkingEmployeesCard, gráficos) | **React Query** (usePunchesDashboard, usePunchesStatistics) ✅ |

### Componentes (por tamaño — criterio evolución: >150 P1, >200 P0)

| Componente | Líneas | Prioridad tamaño |
|------------|--------|-------------------|
| `ManualPunches/BulkPunchExcelUpload.jsx` | 842 | **P0** |
| `ManualPunches/BulkPunchForm.jsx` | 552 | **P0** |
| `TimePunch/NFCPunchManager.jsx` | 522 | **P0** |
| `TimePunch/TimePunchManager.jsx` | 454 | **P0** |
| `ManualPunches/IndividualPunchForm.jsx` | 450 | **P0** |
| `ManualPunches/PunchesCalendar/index.jsx` | 407 | **P0** |
| `ManualPunches/PunchesCalendar/PunchDayDialog.jsx` | 381 | **P0** |
| `ManualPunches/index.jsx` | 47 | OK |

### Configuración

- `src/configs/navgationConfig.js` — menú Gestión Horaria + managers
- `src/configs/entitiesConfig.js` — entidades `employees` y `punches` (tablas, formularios, filtros)

---

## 3. Patrones actuales y desviaciones

### Data fetching

- **React Query** (correcto): solo en `usePunches.js` (dashboard de fichajes y estadísticas).
- **useEffect + useState** (anti-pattern según evolución):
  - `IndividualPunchForm`: carga empleados con `useEffect` + `employeeService.getOptions()`.
  - `BulkPunchForm` / `BulkPunchExcelUpload`: sin carga inicial de lista; validación/envío con funciones del servicio.
  - `PunchesCalendar`: `getPunchesByMonth` en `useEffect` por mes.
  - `TimePunchManager`: `getEmployees` en `useEffect`.
  - `NFCPunchManager`: carga empleados y lógica similar.

### Formularios

- **IndividualPunchForm**: estado local `formData` + `validate()` manual; **no** usa react-hook-form + Zod de forma explícita en el análisis rápido.
- **BulkPunchForm / BulkPunchExcelUpload**: estado local para filas; validación vía servicio `validateBulkPunches`; creación vía `createBulkPunches`/`createManualPunch`.

### TypeScript

- Todo el bloque es **JavaScript** (.js / .jsx). Servicios y componentes sin tipos.

### Duplicidad de servicios

- **Punches**: dos orígenes — `src/services/punchService.js` (legacy, usado por UI de gestión horaria) y `src/services/domain/punches/punchService.js` (genérico para EntityClient). No hay un único “punchService” tipado y usado por React Query en todo el bloque.
- **Employees**: `employeeService.js` (legacy getEmployees) vs `domain/employees/employeeService.js` (list, getOptions). TimePunchManager usa legacy; IndividualPunchForm usa domain getOptions.

---

## 4. Riesgos identificados

1. **Componentes >200 líneas (P0)**: siete componentes; dificultan pruebas y mantenimiento.
2. **Data fetching sin React Query** en manual-punches, calendar, time-punch-manager, nfc-punch-manager: sin caché compartida ni invalidación coherente.
3. **Servicio de punches muy grande** (844 líneas) en un solo archivo; conviene dividir por dominio (listado, manual, bulk, calendar, dashboard) o al menos agrupar funciones.
4. **Posible falta de Zod** en formularios de fichaje manual (validación solo en backend o manual).
5. **Multi-tenant**: uso de `fetchWithTenant` y token; hooks deben incluir `tenantId` en queryKey (usePunches ya lo hace).

---

## 5. Dependencias externas del bloque

- **Dashboard**: `WorkingEmployeesCard`, `WorkerStatisticsCard` usan `usePunches` (React Query) y posiblemente otros datos.
- **Auth**: `useSession()` (next-auth) para token en todos los componentes que cargan datos.
- **API Backend**: ver `docs/API-references/sistema/README.md` (Fichajes, empleados).

---

## 6. Resumen para planificación

- **Consolidar data fetching**: migrar a React Query en Calendar, TimePunchManager, NFCPunchManager, IndividualPunchForm (lista empleados).
- **Tipar y opcionalmente unificar servicios**: punchService a TypeScript; clarificar uso legacy vs domain para no romper EntityClient.
- **Reducir tamaño de componentes**: extraer subcomponentes/hooks de BulkPunchExcelUpload, BulkPunchForm, IndividualPunchForm, PunchesCalendar, PunchDayDialog, TimePunchManager, NFCPunchManager.
- **Formularios**: asegurar Zod + react-hook-form donde aplique (individual y bulk si se refactoriza).
- **Tests**: añadir para hooks y servicios nuevos/refactorizados.

Referencias: `docs/audits/nextjs-frontend-global-audit.md`, `docs/prompts/02_Nextjs frontend evolution prompt.md`.
