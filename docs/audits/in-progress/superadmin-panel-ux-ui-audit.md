# Auditoría UX/UI — Panel Superadmin

**Fecha**: 2026-06-24  
**Alcance**: Desktop. Mobile excluido de momento.  
**Archivos auditados**: 37 (13 app router pages + 24 componentes + 4 infraestructura)

---

## Resumen ejecutivo

1. **Deuda de TypeScript masiva y uniforme**: Todo el panel (13 archivos de App Router + 24 componentes + 4 de infraestructura) está en `.js`/`.jsx`. Ningún archivo usa `.ts`/`.tsx`, incumpliendo la Regla de Oro 3 del proyecto de forma total y sistemática.

2. **Propia capa HTTP paralela a `fetchWithTenant`**: El panel tiene su propio cliente HTTP (`superadminApi.js`) que llama a `fetch()` directamente. Esto es arquitectónicamente correcto para el superadmin (no tiene tenant), pero crea un patrón completamente diferente al resto de la app que hay que documentar explícitamente como excepción en `CLAUDE.md`.

3. **Capa de datos completamente fuera del patrón**: Ningún componente usa TanStack Query. Todo el estado del servidor se gestiona con `useState` + `useEffect` + `fetch` manual. El código es repetitivo y frágil: sin deduplicación de peticiones, sin caché, sin invalidación automática.

4. **Componentes UI propios que duplican primitivos shadcn existentes**: `FilterTabs` reimplementa `Tabs/TabsList/TabsTrigger` con `<button>` nativo; `EmptyState` duplica `src/components/ui/empty.jsx` ya instalado. Hay 5 `<select>` nativos con CSS inline copiado-pegado donde debería ir el `<Select>` de shadcn.

5. **15+ textos con acentos ortográficos ausentes** distribuidos por la UI y mensajes de error visibles al usuario.

---

## 1. Arquitectura y estructura

### 1.1 Deuda TypeScript — 100% del panel en JS

Todo el panel está en `.js`/`.jsx`. La regla del proyecto es explícita: *"Todo código nuevo es `.ts` o `.tsx`. Si tocas un `.js` legacy por cualquier motivo, migrarlo a `.ts`."*

**Archivos afectados** (37 archivos, 100%):
- `src/app/superadmin/layout.js`, `SuperadminLayoutClient.jsx`, todas las `page.js`
- `src/components/Superadmin/*.jsx` — 24 archivos
- `src/configs/superadminConfig.js`, `src/context/SuperadminAuthContext.jsx`, `src/lib/superadminApi.js`, `src/utils/superadminDateUtils.js`

### 1.2 Patrón page → Client Component — incompleto

El resto de la app sigue el patrón `page.tsx` (Server Component que importa un `XxxPageClient.tsx`). El panel superadmin tiene variantes inconsistentes:

- **Correcto**: `tenants/page.js` importa `TenantsTable`; `tenants/new/page.js` importa `TenantForm`. Ambos son Client Components delegados.
- **Problema**: `tenants/[id]/page.js` tiene `'use client'` directamente en el archivo de página (línea 1). Es un Client Component disfrazado de page. Debería moverse la lógica a `TenantDetailPageClient.jsx`.
- **Problema**: `alerts/page.js`, `impersonation/page.js` y `system/page.js` también tienen `'use client'` directamente. Son páginas de App Router que contienen toda la lógica de UI y estado.

### 1.3 Estado del servidor — sin TanStack Query

El panel no usa TanStack Query en absoluto. Cada componente repite el mismo patrón verboso más de 20 veces:

```js
// Patrón repetido en TODOS los componentes (>20 veces)
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetchSuperadmin('/endpoint');
    const json = await res.json();
    setData(json.data || []);
  } catch { /* silent */ }
  finally { setLoading(false); }
}, []);

useEffect(() => { fetchData(); }, [fetchData]);
```

Consecuencias:
- Sin caché: cada navegación re-fetcha todo desde cero
- Sin deduplicación: `ActiveSessionsBanner` y la sidebar (`useAlertCounts`) hacen llamadas paralelas al mismo endpoint `/impersonation/active` cada 30–60 segundos
- Sin invalidación automática: tras una mutación, los componentes llaman manualmente a `fetchData()` sin garantías de coherencia
- Los errores se silencian con `catch { /* silent */ }` en muchos lugares — sin feedback al usuario

### 1.4 Propia capa HTTP — excepción sin documentar

`src/lib/superadminApi.js` usa `fetch()` directo, lo cual es la única excepción arquitectónicamente justificada (el superadmin no tiene tenant y usa su propia autenticación). Sin embargo:
- No está documentado en `CLAUDE.md` como excepción explícita a la regla "nunca usar `fetch()` directo"
- `fetchSuperadmin` se llama directamente desde los componentes, sin una capa service intermedia ni hooks especializados

---

## 2. Componentes UI y shadcn

### 2.1 `FilterTabs` — reimplementa Tabs de shadcn

**Archivo**: `src/components/Superadmin/FilterTabs.jsx`

```jsx
// ❌ Botones nativos con clases manuales que replican variantes de shadcn Tabs
<button
  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    activeKey === tab.key
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted'
  }`}
>
```

El proyecto ya tiene `src/components/ui/tabs.jsx`. La solución correcta:

```tsx
// ✅ Usar Tabs nativo de shadcn
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs value={activeKey} onValueChange={onChange}>
  <TabsList>
    {tabs.map((tab) => (
      <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

`FilterTabs` se usa en 4 lugares: `TenantsTable`, `AlertsPage`, `ErrorLogsTab`, `SystemPage`.

### 2.2 `EmptyState` — duplica `src/components/ui/empty.jsx`

**Archivo**: `src/components/Superadmin/EmptyState.jsx`

El proyecto ya tiene instalado el componente shadcn `Empty/EmptyHeader/EmptyTitle/EmptyDescription/EmptyMedia` en `src/components/ui/empty.jsx`. El superadmin tiene su propio `EmptyState` con una API diferente. Se usa en 9 componentes distintos dentro del panel.

### 2.3 `<select>` nativos con CSS inline — 5 ocurrencias

**Archivos afectados**:
- `src/components/Superadmin/TenantForm.jsx` líneas ~136, 152 — selects Plan y Timezone
- `src/components/Superadmin/TenantDetailSections/BlocklistTab.jsx` línea ~235 — select Tipo (IP/Email)
- `src/components/Superadmin/TenantDetailSections/GeneralData.jsx` líneas ~169, 181 — selects Plan y Timezone

Mismo bloque CSS copiado-pegado en todos:
```jsx
<select
  className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border
             bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1
             focus-visible:outline-none"
  {...register(field)}
>
```

Además, `TenantForm.jsx` usa `h-12 md:h-9` (altura táctil innecesaria en un panel exclusivo de escritorio) mientras que `GeneralData.jsx` usa `h-9` — inconsistencia entre el mismo campo.

El componente `<Select>` de shadcn (`src/components/ui/select.jsx`) está instalado y debe usarse.

### 2.4 Colores Tailwind directos (no semánticos)

Se usan variables semánticas para los casos principales, pero múltiples badges tienen colores de nivel Tailwind directo:

- `text-orange-700 dark:text-orange-400` — en `StatusBadge`, `AlertsPage`, `BlocklistTab`, `MigrationsTab`
- `text-green-600 dark:text-green-400` — en `DashboardCards`, `FeatureFlagsTab`, `MigrationsTab`
- `text-blue-700 dark:text-blue-400` — en `FeatureFlagsTab`, `ImpersonationPage`
- `bg-orange-50 dark:bg-orange-950/20` — en `ActiveSessionsBanner`, `ImpersonationPage`

Estos colores no están definidos como variables CSS semánticas, lo que los hace frágiles ante cambios de tema. El patrón correcto es `--primary`, `--destructive`, `--muted`, etc., o extender el design token system del proyecto.

### 2.5 Clase CSS custom `.login-background`

**Archivo**: `src/components/Superadmin/LoginForm.jsx` líneas ~140, 151

Usa una clase CSS custom `.login-background` definida en `globals.css`. Es una excepción aceptable dado el diseño especial de la página de login, pero no está documentada. Si el proyecto evoluciona el tema, este fondo puede quedar descolgado.

---

## 3. Usabilidad desktop

### 3.1 Formularios — sin Zod ni `zodResolver`

Ningún formulario del panel usa Zod para validación. Usan `react-hook-form` directamente con validaciones inline (`required: 'mensaje'`). El resto de la app usa el patrón `zodResolver`. Impacto: la validación es manual, inconsistente y más difícil de mantener.

**Formularios afectados**:
- `TenantForm.jsx` — creación de tenant (los campos más críticos del panel)
- `AdminsManager.jsx` — creación de admin superadmin
- `BlocklistTab.jsx` — creación de bloqueo IP/Email
- `GeneralData.jsx` — edición de tenant

### 3.2 `FilterTabs` — no accesible como tabs reales

Los `<button>` nativos de `FilterTabs` no tienen roles ARIA `role="tab"`, `aria-selected`, ni `tabindex` correctos. No están contenidos en un `role="tablist"`. Los lectores de pantalla no los identificarán como tabs de filtro. Al reemplazar con el componente `Tabs` de shadcn (que usa Radix UI internamente), la accesibilidad se resuelve automáticamente.

### 3.3 `ImpersonationButtons` — flujo "Usar token" confuso

**Archivo**: `src/components/Superadmin/TenantDetailSections/ImpersonationButtons.jsx`

El botón "Usar token" (icono Key) solo aparece después de enviar una solicitud de consentimiento (`pendingRequest === true`), pero este estado se pierde al recargar la página o al cambiar de pestaña. El usuario que navegó a otra sección y vuelve no verá el botón aunque el admin haya aprobado. No hay instrucción clara sobre qué hacer después de enviar la solicitud ni temporizador de expiración visible.

### 3.4 Polling duplicado — `ActiveSessionsBanner` + sidebar

El dashboard tiene `ActiveSessionsBanner` que hace polling a `/impersonation/active` cada 30 segundos. La sidebar también hace polling a `/alerts` cada 60 segundos. No hay coordinación entre estos pollings ni mecanismo para suspenderlos cuando el usuario está inactivo. Con TanStack Query ambos podrían compartir la misma query cacheada.

### 3.5 `per_page=500` — carga no paginada

**Archivo**: `src/app/superadmin/impersonation/page.js` línea ~159

```js
const res = await fetchSuperadmin('/tenants?per_page=500');
```

Se cargan hasta 500 tenants en memoria para poblar un `<select>`. Si la plataforma crece, esto es un problema de rendimiento y tiempo de respuesta. Debería ser un Combobox con búsqueda lazy.

### 3.6 Errores silenciados — sin feedback al usuario

Múltiples componentes silencian los errores sin mostrarlos:
```js
// En ActiveSessionsBanner, ActivityFeed, QueueHealthWidget...
} catch { /* silent */ }
```

`ActivityFeed` y `ActiveSessionsBanner` no muestran nada si la API falla. El usuario ve "Sin actividad reciente" sin saber si es porque no hay datos o porque la API está caída. Debería mostrarse un mensaje de error con `notify.error()` o un estado de error visible en el componente.

### 3.7 `ErrorLogsTab` — `<>` shorthand Fragment sin `key` en `.map()`

**Archivo**: `src/components/Superadmin/TenantDetailSections/ErrorLogsTab.jsx` líneas ~126–179

```jsx
// ❌ Fragment sin key — React warning en producción + posibles bugs de reconciliación
logs.map((log) => (
  <>
    <TableRow key={log.id}>...</TableRow>
    {expandedId === log.id && <TableRow key={`${log.id}-detail`}>...</TableRow>}
  </>
))
```

El `<>` shorthand no acepta `key`. Debe ser `<React.Fragment key={log.id}>`.

### 3.8 `system/page.js` — `key={i}` con índice de array

**Archivo**: `src/app/superadmin/system/page.js` línea ~116

```jsx
logs.map((log, i) => (
  <React.Fragment key={i}>
```

Se usa el índice como key en un listado que puede reordenarse. Debería usar `log.id` o un identificador estable del log.

### 3.9 Dialogs sin `DialogDescription`

Varios Dialogs del panel no tienen `DialogDescription`, lo que perjudica la accesibilidad con lectores de pantalla (el diálogo se anuncia sin descripción):

- `BlocklistTab.jsx` — Dialog "Agregar bloqueo" sin `DialogDescription`
- `FeatureFlagsTab.jsx` — Dialog de habilitación sin `DialogDescription` en el `DialogHeader`
- `GeneralData.jsx` — Dialog "Editar tenant" sin `DialogDescription`

### 3.10 Botones de expandir sin `aria-label`

**Archivos afectados**: `ErrorLogsTab.jsx` y `system/page.js` (sección Global Error Logs)

```jsx
// ❌ Sin aria-label — solo visible por el ícono
<Button variant="ghost" size="sm" onClick={() => setExpandedId(...)}>
  {expandedId === log.id ? <ChevronUp /> : <ChevronDown />}
</Button>

// ✅
<Button
  variant="ghost"
  size="sm"
  aria-label={expandedId === log.id ? 'Ocultar detalle' : 'Ver detalle'}
  onClick={() => setExpandedId(...)}
>
```

### 3.11 `TenantsTable` — columna "Status" en inglés

**Archivo**: `src/components/Superadmin/TenantsTable.jsx` línea ~143

```jsx
<TableHead>Status</TableHead>  // El resto de columnas están en español
```

Debería ser "Estado".

---

## 4. Consistencia con la app principal

### 4.1 Patrón de formularios — diferente al Admin

El Admin usa `zodResolver` con schemas Zod en todos sus formularios. El Superadmin usa `react-hook-form` puro sin Zod. Esta inconsistencia dificulta el onboarding y pierde la validación de tipo, la mensajería centralizada de errores, y la integración tipada con `setErrorsFrom422`.

### 4.2 Páginas como Client Components directos

El panel Admin sigue `page.tsx` → `XxxPageClient.tsx`. El Superadmin tiene páginas con `'use client'` directamente (`tenants/[id]/page.js`, `alerts/page.js`, etc.). Esto rompe el patrón esperado y hace las páginas más difíciles de extender con layouts server-side en el futuro.

### 4.3 Paginación inline duplicada — no usa `pagination.jsx` de shadcn

El mismo bloque de paginación con `ChevronLeft`/`ChevronRight` + texto de página se implementa inline en 6 componentes distintos. El proyecto tiene `src/components/ui/pagination.jsx` instalado. Debería extraerse a un componente `SuperadminPagination` reutilizable.

### 4.4 Heading `h1` — tamaño inconsistente entre páginas

La mayoría de páginas del Superadmin usan `text-lg font-semibold` para el `<h1>`, pero `page.js` (Dashboard) usa `text-2xl font-semibold`. El Admin principal usa `text-2xl` de forma consistente. El panel debería uniformar el tamaño a `text-2xl`.

---

## 5. Tabla de hallazgos

| # | Archivo | Línea(s) aprox. | Problema | Severidad | Fix recomendado |
|---|---------|-----------------|----------|-----------|-----------------|
| 1 | Todos (37 archivos) | — | Todos en `.js`/`.jsx`, violación Regla de Oro 3 | **Alta** | Migrar a `.ts`/`.tsx` en iteración dedicada |
| 2 | `FilterTabs.jsx` | 15–29 | `<button>` nativo reimplementa shadcn Tabs | **Alta** | Reemplazar con `Tabs`/`TabsList`/`TabsTrigger` de shadcn |
| 3 | `EmptyState.jsx` | 1–29 | Duplica `src/components/ui/empty.jsx` ya instalado | **Alta** | Reemplazar con primitivo shadcn `Empty` |
| 4 | `TenantForm.jsx` | 136, 152 | `<select>` nativo con CSS inline copiado-pegado | **Alta** | Usar `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` de shadcn |
| 5 | `BlocklistTab.jsx` | 235 | `<select>` nativo con CSS inline | **Alta** | Ídem |
| 6 | `GeneralData.jsx` | 169, 181 | `<select>` nativo con CSS inline (duplicado de TenantForm) | **Alta** | Ídem |
| 7 | Todos los formularios | — | Sin Zod; solo validación inline en `react-hook-form` | **Alta** | Crear schemas Zod + `zodResolver` por formulario |
| 8 | `ErrorLogsTab.jsx` | 126 | `<>` shorthand Fragment en `.map()` sin `key` | **Alta** | Cambiar a `<React.Fragment key={log.id}>` |
| 9 | `impersonation/page.js` | 159 | `per_page=500` — carga completa sin paginar | **Media** | Combobox con búsqueda lazy o endpoint `/options` |
| 10 | `system/page.js` | 116 | `key={i}` con índice de array en logs | **Media** | Usar identificador estable (`log.id` u otro) |
| 11 | `tenants/[id]/page.js` | 1 | `'use client'` directo en page — rompe patrón App Router | **Media** | Extraer a `TenantDetailPageClient.jsx` |
| 12 | `alerts/page.js`, `impersonation/page.js`, `system/page.js` | 1 | Ídem | **Media** | Extraer lógica a `XxxPageClient` components |
| 13 | `BlocklistTab.jsx` | 230 | Dialog sin `DialogDescription` | **Media** | Añadir `DialogDescription` |
| 14 | `GeneralData.jsx` | 159 | Dialog sin `DialogDescription` | **Media** | Añadir `DialogDescription` |
| 15 | `ImpersonationButtons.jsx` | 111–154 | Estado `pendingRequest` no persiste; UX confusa | **Media** | Persistir en `sessionStorage` o mostrar guía contextual |
| 16 | `ActiveSessionsBanner.jsx` + `SuperadminLayoutClient.jsx` | — | Polling duplicado al mismo endpoint | **Media** | Compartir estado via Context o TanStack Query |
| 17 | Múltiples componentes | — | Errores de fetch silenciados sin feedback | **Media** | Mostrar error con `notify.error()` o estado de error visible |
| 18 | 6 componentes | — | Paginación duplicada inline; no usa `pagination.jsx` de shadcn | **Media** | Extraer componente `SuperadminPagination` |
| 19 | `ErrorLogsTab.jsx` | 149–159 | Botones expand sin `aria-label` | **Media** | Añadir `aria-label="Ver detalle"` / `"Ocultar detalle"` |
| 20 | `system/page.js` | 119 | Botón expand sin `aria-label` | **Media** | Ídem |
| 21 | `superadminApi.js` | — | Excepción `fetch()` directo no documentada en `CLAUDE.md` | **Media** | Añadir nota explícita de excepción justificada |
| 22 | `TenantsTable.jsx` | 143 | Columna "Status" en inglés | **Baja** | Renombrar a "Estado" |
| 23 | `ActiveSessionsBanner.jsx` | 36 | "impersonacion" sin acento | **Baja** | "impersonación" |
| 24 | `SubdomainField.jsx` | 26, 32, 97 | "minusculas", "Maximo", "esta en uso" sin acentos | **Baja** | "minúsculas", "Máximo", "está en uso" |
| 25 | `BlocklistTab.jsx` | 142, 266 | "Accion", "vacio" sin acento | **Baja** | "Acción", "vacío" |
| 26 | `StatusActions.jsx` | 106, 113 | "Accion ejecutada", "accion" sin acento | **Baja** | "Acción" |
| 27 | `TokensTab.jsx` | 107, 182–183 | "Accion", "Ultimo", "sesion" sin acento | **Baja** | "Acción", "Último", "sesión" |
| 28 | `ErrorLogsTab.jsx` | 96 | "Metodo" sin acento | **Baja** | "Método" |
| 29 | `OnboardingProgress.jsx` | 14–17 | "Catalogos", "Configuracion", "Activacion" sin acento | **Baja** | "Catálogos", "Configuración", "Activación" |
| 30 | `TenantUsersTable.jsx` | 77–78 | "aun", "esta" sin acento | **Baja** | "aún", "está" |
| 31 | `AlertsWidget.jsx` | 69 | "critica" sin acento | **Baja** | "crítica" |
| 32 | Dashboard `page.js` vs resto | — | `h1` usa `text-2xl` pero otras páginas usan `text-lg` | **Baja** | Uniformar a `text-2xl` (consistente con Admin) |
| 33 | Múltiples | — | Colores Tailwind directos (`orange-700`, `green-600`) en badges | **Baja** | Definir tokens semánticos o usar variantes de shadcn Badge |

---

## 6. Recomendaciones priorizadas

### Prioridad 1 — Bugs reales (arreglar ya)

1. **Corregir `key` en `ErrorLogsTab`** — `<>` → `<React.Fragment key={log.id}>`. React genera warnings en producción y puede producir bugs de reconciliación visual.
2. **Cambiar `key={i}` en `system/page.js`** — usar `log.id` o un identificador estable del log.
3. **Añadir `DialogDescription`** a los 3 Dialogs que la omiten (accesibilidad: los screen readers anuncian el diálogo sin descripción).

### Prioridad 2 — Deuda de UI crítica (próximo sprint)

4. **Reemplazar `FilterTabs`** con `Tabs`/`TabsList`/`TabsTrigger` de shadcn — componente propio que duplica funcionalidad instalada, sin accesibilidad ARIA.
5. **Reemplazar `EmptyState`** con el primitivo `Empty` de `src/components/ui/empty.jsx`.
6. **Reemplazar los 5 `<select>` nativos** con `<Select>` de shadcn — misma API con `react-hook-form` vía `Controller`.
7. **Añadir `aria-label`** a los botones de expandir en `ErrorLogsTab` y `SystemPage`.
8. **Extraer componente `SuperadminPagination`** — el mismo bloque aparece 6 veces inline.

### Prioridad 3 — Arquitectura de datos (iteración dedicada)

9. **Introducir TanStack Query** para los endpoints de listado (tenants, admins, alerts) — elimina el boilerplate de `useState/useEffect/useCallback` repetido en cada componente y añade caché.
10. **Crear capa service** para los endpoints del superadmin (`tenantSuperadminService`, `alertsService`) — separar la lógica HTTP de los componentes siguiendo el patrón de la app.
11. **Resolver polling duplicado** — compartir queries de TanStack Query entre `ActiveSessionsBanner` y la sidebar.
12. **Limitar `per_page=500`** en la carga de tenants de impersonaciones — implementar Combobox con búsqueda lazy.
13. **Mostrar errores de fetch** en lugar de silenciarlos — mínimo un `notify.error()` en los `catch`.

### Prioridad 4 — Calidad y consistencia (mejora continua)

14. **Añadir schemas Zod** a todos los formularios (`TenantForm`, `AdminsManager`, `BlocklistTab`, `GeneralData`) — consistencia con el resto de la app.
15. **Extraer páginas con `'use client'`** a componentes PageClient separados — `tenants/[id]/page.js`, `alerts/page.js`, `impersonation/page.js`, `system/page.js`.
16. **Migrar todos los archivos a `.ts`/`.tsx`** — es la regla más básica del proyecto y la deuda más amplia. Candidato a sprint de migración.
17. **Corregir los 15+ textos sin acento** — especialmente los visibles en cabeceras, toasts y mensajes de error.
18. **Uniformar heading `h1`** — `text-2xl font-semibold` en todas las páginas del panel.
19. **Documentar `superadminApi.js` en `CLAUDE.md`** como excepción explícita a la regla "nunca usar `fetch()` directo", con justificación.
