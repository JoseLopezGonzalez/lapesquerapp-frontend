# STEP 0 — Configuración por tenant: Comportamiento actual de la UI

**Fecha**: 2026-02-15
**Bloque**: Configuración por tenant

---

## 1. Estados de la UI

### SettingsForm

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Loading** | `loading === true` | Loader centrado (no se muestra el formulario) |
| **Formulario visible** | `loading === false` | Formulario con todas las secciones; ScrollArea; botón Guardar |
| **Saving** | `saving === true` | Botón deshabilitado, texto "Guardando..." |

### SettingsContext (consumidores: AdminLayoutClient, SideBar, OrderMap)

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Loading** | `loading === true` | Consumidores muestran fallback (ej. "Empresa") |
| **Loaded** | `loading === false`, `settings` disponible | Consumidores muestran datos (company.name, logo, etc.) |
| **Error** | 5xx o red | `settings = {}`, no reintenta automáticamente |
| **401/403** | isAuthError | signOut(); redirect a login |

### getSettingValue (helper fuera de React)

| Estado | Condición | Comportamiento |
|--------|-----------|----------------|
| **Sin caché** | `!cachedSettingsByTenant[tenant]` | Llama getSettings(), cachea, retorna valor |
| **Con caché** | Caché presente | Retorna valor sin llamar API |
| **forceRefresh** | `forceRefresh === true` | Bypass caché, recarga desde API |

---

## 2. Interacciones de usuario

| Acción | Trigger | Efecto |
|--------|---------|--------|
| Entrar en /admin/settings | Navegación | Monta SettingsForm; useEffect carga getSettings() |
| Editar campo (Input) | onChange | handleChange → setValues |
| Editar Select (encriptación) | onValueChange | handleEmailChange → setValues |
| Mostrar/ocultar contraseña | Click botón Eye/EyeOff | setShowPassword toggle |
| Cambiar contraseña SMTP | onChange Input password | handlePasswordChange → setEmailPassword |
| Guardar | Submit formulario | validateEmailSettings(); si OK → updateSettings(); setSettings(payload); toast.success |
| Cambiar de tenant (otra pestaña y volver) | visibilitychange / focus | SettingsContext: tenantKey++; re-ejecuta useEffect; getSettings() con nuevo tenant |

---

## 3. Flujo de datos

```
[API v2/settings GET] 
    ↓
settingsService.getSettings() 
    ↓ (fetchWithTenant inyecta X-Tenant)
[SettingsContext] → settings, loading, setSettings
[SettingsForm] → useEffect: getSettings() → setValues(data)

[Usuario edita y Guarda]
    ↓
validateEmailSettings() (cliente)
    ↓ OK
updateSettings(payload) 
    ↓ (API v2/settings PUT)
setSettings(payload) → invalidateSettingsCache()
    ↓
Todos los consumidores (AdminLayoutClient, SideBar, OrderMap) reciben nuevos datos vía Context
```

---

## 4. Reglas de validación (cliente)

| Campo / Regla | Validación |
|---------------|------------|
| **Email SMTP obligatorios** | host, port, encryption, username, from_address; si primera vez: password |
| **Host SMTP** | Hostname válido (regex: `^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`) |
| **Puerto** | Número 1–65535 |
| **Encriptación** | Solo 'tls' o 'ssl' |
| **Username** | Email válido (regex) |
| **from_address** | Email válido (regex) |
| **Password** | Obligatorio si no había configuración previa |
| **Resto de campos** | Sin validación cliente (solo backend) |

---

## 5. Permisos

| Rol | Acceso |
|-----|--------|
| Admin | Acceso a /admin/settings; puede ver y editar configuración |
| Operario / otros | Protegido por AdminRouteProtection; no llega a la ruta |

---

## 6. Manejo de errores

| Escenario | Comportamiento |
|-----------|----------------|
| Error al cargar settings | toast.error('Error al cargar configuración') |
| 401/403 en getSettings | settingsService retorna null; fetchWithTenant dispone evento; SettingsContext: signOut si isAuthError |
| 401/403 en updateSettings | result.authError; return sin toast (interceptor gestiona) |
| Error genérico en updateSettings | toast.error con userMessage o mensaje backend |
| Error "configuración de email incompleta" | Mensaje amigable específico |
| Errores 5xx en SettingsContext | hasErrorRef=true; no reintenta automáticamente; settings={} |
| Validación cliente falla | toast.error con mensaje concreto; no se llama updateSettings |
