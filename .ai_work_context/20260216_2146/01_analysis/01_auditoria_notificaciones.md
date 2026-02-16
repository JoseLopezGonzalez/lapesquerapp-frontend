# Auditoría global — Sistemas de notificación

**Estado**: Completado  
**Última actualización**: 2026-02-16

---

## 1. Uso de `react-hot-toast`

### 1.1 Punto de montaje global
| Archivo | Uso | Notas |
|---------|-----|--------|
| `src/app/ClientLayout.js` | `<Toaster />` + `import { Toaster } from "react-hot-toast"` | Único montaje activo del Toaster en la app |

Comentado (no activo): `src/components/Admin/Stores/StoresManager/Store/index.js` — `{/* createPortal(<Toaster />, document.body) */}`

### 1.2 Wrapper / tema personalizado
- **Archivo**: `src/customs/reactHotToast/index.js`
- **Exporta**: `getToastTheme()`, `darkToastTheme`
- **Función**: Devuelve `style` (background, color, borderColor, borderWidth) según tema (dark/light) leyendo `document.documentElement.classList.contains("dark")`.
- **Uso**: Pasado como segundo argumento en la mayoría de llamadas `toast.*(msg, getToastTheme())` o `{ ...getToastTheme(), duration: N }`.

### 1.3 Imports y llamadas por archivo (solo código fuente `src/`, excl. docs y .agents)

| Archivo | toast.success | toast.error | toast.loading | toast.info | toast.dismiss | getToastTheme | Complejidad | Riesgo |
|---------|---------------|-------------|---------------|------------|---------------|---------------|-------------|--------|
| OrquestadorView.jsx | 9 | 16 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| SupplierLiquidationList.tsx | 0 | 4 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| SupplierLiquidationDetail.tsx | 1 | 3 | 1 | 0 | 0 | ✓ | Async (loading→success/error) | Medio |
| EntityClient/index.js | 6 | 12 | 2 | 0 | 0 | ✓ | Async + JSX en loading | Medio |
| IndividualPunchForm.jsx | 2 | 3 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| useLinkPurchases.js | 1 | 5 | 0 | 1 | 0 | ✓ | Condicional, duration 6000 | Bajo |
| ExportModal (LonjaDeIsla) | 1 | 4 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| ExportModal (AlbaranCofraWeb) | 1 | 4 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| ExportModal (PuntaDelMoral) | 1 | 4 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| MassiveExportDialog.js | 1 | 2 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| IndividualMode/index.js (MDE) | 0 | 7 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| useLabelEditor.ts | 5 | 11 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| LabelSelectorSheet.jsx | 2 | 3 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| LabelEditor/index.js | 0 | 0 | 0 | 0 | 0 | ✓ | Solo import (usa hook) | Bajo |
| BulkPunchExcelUpload.jsx | 5 | 18 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| BulkPunchForm.jsx | 2 | 10 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| TimePunchManager.jsx | 0 | 3 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| PunchesCalendar/index.jsx | 0 | 1 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| SettingsForm.js | 1 | 2 | 0 | 0 | 0 | — | Sin getToastTheme | Bajo |
| ReceptionsListCard/index.js | 0 | 1 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| DispatchesListCard/index.js | 0 | 1 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| WorkerStatisticsCard/index.js | 0 | 1 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| OrderRanking/index.js | 0 | 1 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| useAdminReceptionForm.js | 0 | 2 | 0 | 0 | 0 | ✓ | Simple | Bajo |
| useStoreDialogs.js | — | — | 1 | 0 | 2 | ✓ | loading + dismiss | Medio |
| useLoginActions.ts | — | — | — | — | — | ✓ | (verificar uso) | Bajo |
| AuthErrorInterceptor.tsx | — | — | — | — | — | ✓ | (verificar uso) | Bajo |
| OrderEditSheet/index.js | 1 | 0 | 1 | 1 | 0 | ✓ | loading→success/info | Medio |
| CreateOrderForm/index.js | — | — | 1 | 0 | 0 | ✓ | loading→success/error | Medio |
| useOrderPallets.js | — | — | — | — | — | ✓ | toast.info x3 | Bajo |
| Order/index.js (OrdersManager) | — | — | 2 | 0 | 0 | ✓ | loading→success/error | Medio |
| useCustomerHistory.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| useOrder.js | — | — | 1 | 0 | 0 | ✓ | loading export | Medio |
| OrdersManager/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| OrderPlannedProductDetails/index.js | — | — | 3 | 0 | 0 | ✓ | 3 loadings | Medio |
| AdminLayoutClient.jsx | — | — | — | — | — | ✓ | (verificar) | Bajo |
| EditEntityForm/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| CreateEntityForm/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| BoxLabelPrintDialog/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| OrdersList/index.js | — | — | 1 | 0 | 0 | ✓ | loading export | Medio |
| Navbar/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| SideBar/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| ProductionView/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| OrderDocuments/index.js | — | — | 3 | 0 | 0 | ✓ | 3 loadings | Medio |
| OrderIncident/index.js | — | — | 3 | 0 | 0 | ✓ | 3 loadings | Medio |
| EditEntityClient copy.js | — | — | — | — | — | ✓ | Cópia; considerar eliminar | Bajo |
| usePallet.js | — | — | — | — | — | ✓ | múltiples toasts | Medio |
| PalletView/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| MoveMultiplePalletsToStoreDialog | — | — | — | — | — | ✓ | (verificar) | Bajo |
| EditReceptionForm/index.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| WarehouseOperatorLayout | — | — | — | — | — | ✓ | (verificar) | Bajo |
| MassiveExportModal.js | — | — | — | — | — | ✓ | toast.info | Bajo |
| useReceptionForm.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| AddElementToPositionDialog | — | — | — | — | — | ✓ | (verificar) | Bajo |
| MovePalletToStoreDialog | — | — | — | — | — | ✓ | (verificar) | Bajo |
| useOperarioReceptionForm.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| useStorePositions.js | — | — | — | — | — | ✓ | (verificar) | Bajo |
| GenericFilters/AutocompleteFilter.js | — | — | — | — | — | ✓ | (verificar) | Bajo |

Resumen cuantitativo (aprox. en `src/`):
- **Archivos con import de `react-hot-toast` o `getToastTheme`**: ~55+ (incl. hooks y componentes).
- **toast.loading + id (reemplazo por success/error con mismo id)**: 15+ sitios.
- **toast.dismiss**: 2 (useStoreDialogs.js).
- **toast.info**: 6 sitios.
- **Contenido JSX en toast** (EntityClient loading con iconos): 2 flujos (export/report).

---

## 2. Otros sistemas de notificación

### 2.1 Hook y componentes custom `useNotifications`
- **Archivo**: `src/hooks/useNotifications.js`
- **Tipo**: Sistema custom (estado React + componente propio).
- **API**: `showSuccess`, `showError`, `showWarning`, `showInfo`, `showNotification`, `removeNotification`, `clearNotifications`, `handleApiError`.
- **Componentes**: `NotificationContainer`, `NotificationToast` (interno).
- **Comportamiento**: Cola en estado, duración configurable, opción de acción (actionLabel/onAction), estilos por tipo (success/error/warning/info), posición fija `top-4 right-4`.
- **Uso en proyecto**: Solo definido en el hook; **no se encontraron usos de `useNotifications` ni `<NotificationContainer>` en el resto de `src/`**. Es código disponible pero no integrado en layouts ni flujos actuales.
- **Clasificación**: Custom, no usado activamente. **Impacto migración**: Bajo (se puede dejar como está o deprecar a favor de Sileo).

### 2.2 Alerts / UI (no como toast)
- **`src/components/ui/alert.jsx`**: Componente de UI tipo Alert (inline), no sistema de notificación global. No sustituir por Sileo; mantener para mensajes en página.
- **InstallPromptBanner (PWA)**: Banner de instalación, no toast.
- **AccessibilityAnnouncer**: Anuncios de accesibilidad; no es toast.

### 2.3 Modales como feedback
- No se detectó uso sistemático de modales solo como reemplazo de toasts. Los modales del ERP son para formularios/confirmación, no para “mensaje breve”.

### 2.4 shadcn/ui Toaster
- Referencias en `.agents/skills/shadcn-ui/SKILL.md` son documentación de shadcn, no código activo del proyecto. El proyecto **no** usa el Toaster de shadcn en `src/`.

---

## 3. Clasificación por tipo y riesgo

| Tipo | Cantidad aprox. | Complejidad | Riesgo migración | Impacto UX |
|------|------------------|-------------|-------------------|------------|
| toast.success/error simple (texto + getToastTheme) | Alta | Simple | Bajo | Mismo mensaje y posición |
| toast con duration custom (6000) | 1–2 | Simple | Bajo | Respetar duración |
| toast.loading → success/error (mismo id) | 15+ | Async | Medio | Mantener flujo loading→resultado |
| toast.loading con JSX (iconos) | 2 (EntityClient) | Async + contenido | Medio | Sileo puede usar title/desc o string |
| toast.info | 6 | Simple | Bajo | Mapear a sileo.info |
| toast.dismiss(id) | 2 | Manual | Medio | Sileo: ver si hay dismiss o equivalente |
| useNotifications (custom) | 0 usos | N/A | Bajo | Sin impacto si no se usa |

---

## 4. Resumen ejecutivo auditoría

- **Sistema principal**: `react-hot-toast` con tema vía `getToastTheme()` desde `@/customs/reactHotToast`.
- **Montaje**: Un solo `<Toaster />` en `ClientLayout.js`.
- **Patrones a migrar**: success, error, info, loading (y reemplazo por success/error con mismo id), dismiss, duración custom, y en 2 casos contenido rico (iconos) en loading.
- **Otro sistema**: `useNotifications.js` (toast custom) definido pero **no usado** en la app; opcional unificar después con Sileo o deprecar.
- **No hay** otros sistemas activos (no shadcn Toaster, no alertas globales tipo snackbar externo).
