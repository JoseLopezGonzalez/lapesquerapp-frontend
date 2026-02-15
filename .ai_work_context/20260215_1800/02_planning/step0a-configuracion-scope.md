# STEP 0a — Bloque Configuración por tenant: Scope y mapeo de entidades

**Fecha**: 2026-02-15
**Estado**: Pendiente confirmación usuario

---

## Entidades del bloque

### 1. Componentes principales
| Entidad | Archivo | Líneas | Función |
|---------|---------|--------|---------|
| **SettingsForm** | `src/components/Admin/Settings/SettingsForm.js` | ~428 | Formulario de configuración: datos empresa, dirección, web/logo, contactos, legales, email SMTP |
| **SettingsPage** | `src/app/admin/settings/page.js` | ~5 | Wrapper que renderiza SettingsForm |

### 2. Context y estado
| Entidad | Archivo | Líneas | Función |
|---------|---------|--------|---------|
| **SettingsContext** | `src/context/SettingsContext.js` | ~178 | Provider: settings, loading, setSettings; carga getSettings() con tenant; invalidación caché; manejo 401/403 |
| **SettingsProvider** | (en SettingsContext) | — | Envuelto en ClientLayout; provee settings a toda la app |

### 3. Servicios y API
| Entidad | Archivo | Líneas | Función |
|---------|---------|--------|---------|
| **settingsService** | `src/services/settingsService.js` | ~53 | getSettings(), updateSettings() — API v2/settings GET y PUT |

### 4. Helpers
| Entidad | Archivo | Líneas | Función |
|---------|---------|--------|---------|
| **getSettingValue** | `src/helpers/getSettingValue.js` | ~101 | getSettingValue(key, forceRefresh); caché por tenant; invalidateSettingsCache(); clearAllSettingsCache() |

### 5. Consumidores de settings (fuera del bloque, pero relacionados)
| Componente | Uso |
|------------|-----|
| AdminLayoutClient | settings["company.name"] para título |
| SideBar | settings["company.name"], logo |
| OrderMap | settings para mapa |

---

## Artefactos por tipo

| Tipo | Archivos |
|------|----------|
| **Pages** | admin/settings/page.js |
| **Components** | Admin/Settings/SettingsForm.js |
| **Context** | SettingsContext.js |
| **Services** | settingsService.js |
| **Helpers** | getSettingValue.js |
| **Tests** | **Ninguno** (settingsService, SettingsContext, SettingsForm, getSettingValue sin tests) |
| **Docs** | docs/USO_SETTINGS.md, docs/06-CONTEXT-API.md |

---

## Fuera de scope (configuración de aplicación, no por tenant)

- `configs/config.js` — API_URL, etc.
- `configs/entitiesConfig.js` — CRUD entities
- `configs/navgationConfig.js` — Navegación
- `configs/roleConfig.ts`, `authConfig.ts` — Auth/roles
- `configs/sectionsConfig.js` (Order) — Secciones Order

---

## Resumen

**Bloque Configuración por tenant incluye:**
- **Entidades**: SettingsForm, SettingsContext, settingsService, getSettingValue
- **Artefactos**: 1 página, 1 componente, 1 context, 1 service, 1 helper
- **Tests existentes**: 0
- **Dependencias**: fetchWithTenant, getCurrentTenant, useSession (next-auth)

---

¿Confirmas este scope o hay que añadir/quitar algo?
