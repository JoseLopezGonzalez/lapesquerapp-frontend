# STEP 1 — Bloque Configuración por tenant: Análisis

**Fecha**: 2026-02-15
**Rating antes: 4/10**

---

## 1. Qué hace el módulo

Permite a cada tenant configurar datos de empresa (nombre, CIF, dirección, contactos, legales, email SMTP). Los settings se cargan vía Context global y un helper `getSettingValue`. Los consumidores (AdminLayoutClient, SideBar, OrderMap) muestran company.name y logo.

---

## 2. Por entidad

| Entidad | Estado | Problemas |
|---------|--------|-----------|
| **settingsService.js** | JS, sin tipos | P0: Sin tests; P1: Data fetching manual; migrar a TS |
| **SettingsContext.js** | useEffect + getSettings | P1: Patrón manual; debería usar React Query |
| **SettingsForm.js** | ~428 líneas | P1: useEffect + useState; validación inline, no Zod; componente >150 líneas |
| **getSettingValue.js** | Caché propio | P2: Duplica lógica de React Query; convivir con useSettings |

---

## 3. Cumplimiento tech stack

| Requisito | Estado |
|-----------|--------|
| **Data Fetching** | ❌ useEffect + useState (SettingsForm, SettingsContext) — migrar a React Query |
| **Forms** | ❌ Validación inline (validateEmailSettings); no usa Zod — P1 |
| **TypeScript** | ❌ settingsService en JS — P0 para servicios |
| **Tests** | ❌ Sin tests para settingsService — P0 |
| **Multi-tenancy** | ✅ getCurrentTenant; tenant en caché; aislamiento correcto |

---

## 4. Patrones estructurales

| Patrón | Estado |
|--------|--------|
| Custom Hooks | ❌ No hay useSettings como hook React Query |
| API Layer | ✅ settingsService centralizado |
| Form validation | ❌ Inline, no Zod |
| Loading/Error | ✅ Loader, toast.error; SettingsContext maneja 401/403 |

---

## 5. Oportunidades de mejora (priorizadas)

**P0 (bloqueantes CORE):**
- Tests para settingsService (14+ tests como orderService)
- Migrar settingsService a TypeScript

**P1:**
- useSettings con React Query (reemplazar SettingsContext fetch o complementar)
- SettingsForm: useForm + zodResolver para validación
- Extraer useSettingsForm para reducir SettingsForm <150 líneas
- Migrar SettingsContext a usar useSettings internamente (o deprecar Context fetch si React Query cubre)

**P2:**
- Migrar SettingsForm, getSettingValue, SettingsContext a TS
- Tests para useSettings, useSettingsForm

---

## 6. Riesgos

- Cambiar SettingsContext puede afectar AdminLayoutClient, SideBar, OrderMap
- getSettingValue se usa fuera de React: mantener compatibilidad o documentar migración

---

## 7. Plan de sub-bloques

1. **Sub-bloque 1**: settingsService TypeScript + tests (P0)
2. **Sub-bloque 2**: useSettings React Query; SettingsContext usa useSettings (P1)
3. **Sub-bloque 3**: SettingsForm Zod + react-hook-form + useSettingsForm (P1)
4. **Sub-bloque 4**: Reducir SettingsForm <150 líneas si queda por encima
