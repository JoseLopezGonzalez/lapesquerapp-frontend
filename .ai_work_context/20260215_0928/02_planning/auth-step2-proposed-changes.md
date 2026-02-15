# STEP 2 — Bloque Auth: propuesta de cambios

**Fecha**: 2026-02-15  
**Estado**: Pendiente de aprobación del usuario  
**Última actualización**: 2026-02-15

---

## Sub-bloque 1 (primer bloque a aprobar): authService TypeScript + tipos API + tests

Este sub-bloque **no modifica UI ni flujos de usuario**. Solo añade tipos, migra el servicio a TypeScript y añade tests. Reversible y de riesgo bajo.

---

### 1. Mejoras a aplicar en Sub-bloque 1

| # | Mejora | Detalle |
|---|--------|--------|
| 1.1 | **Tipos TypeScript para API de auth** | Crear `src/types/auth.ts` (o `src/services/auth.types.ts`) con interfaces para: respuestas de `request-access` (`{ message?: string }`), `magic-link/verify` y `otp/verify` (`{ access_token: string; user: AuthUser }`), usuario actual `/me` (alias de AuthUser), y `AuthUser` (campos: id, email, name, role, assigned_store_id, company_name, company_logo_url, etc. según lo que devuelva el backend). Tipos alineados con `next-auth.d.ts` donde aplique (role como string o string[]). |
| 1.2 | **Migrar authService.js → authService.ts** | Mismo comportamiento y mismas firmas públicas. Parámetros y retornos tipados con las interfaces anteriores. Mantener constantes (THROTTLE_MESSAGE), JSDoc donde ayude. Eliminar `src/services/authService.js` tras crear `authService.ts` para que los imports `@/services/authService` resuelvan al .ts (Next.js y Vitest resuelven sin extensión). |
| 1.3 | **Tests unitarios authService** | Crear `src/__tests__/services/authService.test.ts` (o .js si se prefiere mantener JS en tests por ahora). Mockear `@lib/fetchWithTenant` y `next-auth/react` (getSession). Casos: requestAccess (éxito, 429, error backend); requestOtp (éxito, error); verifyOtp (éxito, error con status/data); verifyMagicLinkToken (éxito, error); logout (con token, sin token, backend falla); getCurrentUser (éxito, sin sesión, response no ok). Mismo patrón que `orderService.test.js`. |
| 1.4 | **Tests unitarios authConfig** | Crear `src/__tests__/configs/authConfig.test.ts` (o .js). Probar: isAuthError (null, UNAUTHENTICATED, mensajes en AUTH_ERROR_MESSAGES, mensaje que no matchea); isAuthStatusCode (401, 403, 200); buildLoginUrl (sin from, con from, from con caracteres especiales). Sin mocks necesarios; lógica pura. |

---

### 2. Impacto esperado

- **Mantenibilidad**: authService tipado reduce regresiones al cambiar respuestas del backend o al refactorizar; IDE y build detectan usos incorrectos.
- **Cobertura**: Primera red de tests en el bloque Auth; cualquier cambio en authService o authConfig podrá validarse con `npm run test:run`.
- **Consistencia**: Alineado con requisito P0 del proyecto (TypeScript en servicios, tests en módulos críticos).
- **Sin impacto en UX**: Cero cambios en pantallas ni en flujos; los consumidores (LoginPage, auth/verify, AdminLayoutClient) siguen importando desde `@/services/authService` sin cambiar código (el path es el mismo al reemplazar .js por .ts).

---

### 3. Evaluación de riesgos

| Riesgo | Nivel | Mitigación |
|--------|--------|------------|
| Resolución de módulo | Bajo | tsconfig ya tiene `allowJs`, `paths` y el proyecto tiene otros .ts (next-auth.d.ts, orderService.ts, etc.). Eliminar solo authService.js cuando authService.ts exista y pase build + tests. |
| Diferencias de tipos con backend | Bajo | Definir interfaces con campos opcionales donde la API sea variable; evitar `any`. Si el backend devuelve algo no contemplado, se puede ampliar el tipo en un siguiente cambio. |
| Tests frágiles (mocks) | Bajo | Mocks acotados a fetchWithTenant y getSession; aserciones sobre argumentos y retornos, no sobre implementación interna. |

**Nivel global del sub-bloque: Bajo.**

---

### 4. Estrategia de verificación

- **Build**: `npm run build` sin errores.
- **TypeScript**: `npx tsc --noEmit` (si existe script) o que el build de Next.js no reporte errores de tipos.
- **Tests**: `npm run test:run` — todos pasan, incluidos los nuevos `authService.test.*` y `authConfig.test.*`.
- **Lint**: `npm run lint` sin errores en archivos tocados.
- **Manual (regresión mínima)**: En entorno de desarrollo: (1) Login con OTP (solicitar acceso → introducir código → entrar a /admin/home). (2) Cerrar sesión desde el menú de usuario. (3) Abrir enlace de magic link (si se dispone de uno) y comprobar redirección. No se requieren cambios en la UI; solo confirmar que el flujo sigue igual.

---

### 5. Plan de rollback

Si tras aplicar el sub-bloque aparece algún fallo (build, tests o flujo manual):

1. Revertir el commit del sub-bloque: `git revert <commit-hash>`.
2. Restaurar `src/services/authService.js` (si se eliminó) desde el commit anterior.
3. Eliminar los archivos nuevos: `src/services/authService.ts`, `src/types/auth.ts` (o el path elegido), `src/__tests__/services/authService.test.*`, `src/__tests__/configs/authConfig.test.*`.
4. Ejecutar de nuevo `npm run build` y `npm run test:run` para confirmar estado estable.

No se añaden dependencias nuevas; no hace falta `npm install` en el rollback.

---

### 6. Análisis de breaking changes

- **Imports**: Los archivos que importan desde `@/services/authService` no cambian de ruta (LoginPage, auth/verify/page.js, AdminLayoutClient). La resolución de módulo pasa de .js a .ts; en Node/Next/Vitest no se considera breaking cuando las exportaciones (nombres y firmas) se mantienen.
- **Firmas exportadas**: Se mantienen: `requestAccess(email)`, `verifyMagicLinkToken(token)`, `requestOtp(email)`, `verifyOtp(email, code)`, `logout()`, `getCurrentUser()`. Solo se añaden tipos; en JavaScript los consumidores siguen igual.
- **Conclusión**: Sin breaking changes para el resto del proyecto.

---

### 7. Rating después (estimado) y gap al 9/10

- **Rating después del Sub-bloque 1**: Se estima **5,5–6/10** para el bloque Auth (sube desde 4/10 por: servicio tipado, tipos de API, y tests en servicio y config; el resto del bloque sigue con LoginPage grande, sin Zod en formularios, etc.).
- **Gap restante hacia 9/10** (para siguientes sub-bloques):
  - P0: Dividir LoginPage en subcomponentes/hooks (<150 líneas por archivo).
  - P1: Zod + react-hook-form en login/verify.
  - P1: Migrar a TS el resto del bloque (middleware, NextAuth route, componentes Auth).
  - P2: getAuthToken logs; decisión sobre ProtectedRoute; logs del middleware.

---

## Resumen de aprobación

Se solicita **aprobación explícita** para ejecutar **solo el Sub-bloque 1**:

1. Crear tipos en `src/types/auth.ts` para las respuestas de la API de auth.
2. Crear `src/services/authService.ts` tipado y eliminar `src/services/authService.js`.
3. Añadir `src/__tests__/services/authService.test.ts` (o .js).
4. Añadir `src/__tests__/configs/authConfig.test.ts` (o .js).

Tras tu aprobación se procederá a **STEP 3 (Implementación)**, **STEP 4 (Validación)** y **STEP 5 (Log)**. Si prefieres ajustar el alcance (por ejemplo, solo tipos + migración sin tests, o solo tests sin migrar a TS aún), indícalo y adapto la propuesta.

---

**¿Apruebas el Sub-bloque 1 tal como está descrito?**

---

## Sub-bloque 2: Dividir LoginPage en subcomponentes y hooks (<150 líneas)

**Objetivo**: Reducir LoginPage (~610 líneas) a &lt;150 líneas por archivo (P0), sin cambiar comportamiento ni UI.

### Mejoras a aplicar

| # | Mejora | Detalle |
|---|--------|--------|
| 2.1 | **Util login** | `src/utils/loginUtils.js`: `safeRedirectFrom(from)`, `getRedirectUrl(user, searchString)` (lógica pura para redirección post-login). |
| 2.2 | **useLoginTenant** | Hook que encapsula el useEffect de comprobación de tenant, branding y demo. Retorna `{ tenantChecked, tenantActive, brandingImageUrl, isDemo, demoEmail }`. |
| 2.3 | **useLoginActions** | Hook con `handleAcceder`, `handleVerifyOtp`, `backToEmail`, `handleOtpPaste` y el efecto de rellenar OTP desde portapapeles. Recibe estado (email, code, accessRequested, loading, tenantActive) y setters; retorna los handlers. |
| 2.4 | **LoginWelcomeStep** | Componente que recibe `brandingImageUrl`, `isDemo`, `tenantActive`, `onContinue`. Renderiza la pantalla de bienvenida móvil (imagen, título, RotatingText, botón Continuar, enlaces legales). |
| 2.5 | **LoginFormContent** | Componente reutilizable para el bloque email (input + botón Acceder) o OTP (alertas + InputOTP + Verificar + Volver). Props: `accessRequested`, `email`, `setEmail`, `code`, `setCode`, `loading`, `tenantActive`, handlers, `variant: 'desktop'|'mobile'`. |
| 2.6 | **LoginFormDesktop** / **LoginFormMobile** | Cada uno envuelve título, RotatingText y `LoginFormContent` en el layout correspondiente (Card+imagen vs columna con botón volver). Reciben las mismas props que necesita el formulario. |
| 2.7 | **LoginPage (index.js)** | Orquesta: usa useLoginTenant, useLoginActions, estado local (email, code, loading, accessRequested, showForm); si !tenantChecked → Loader; si shouldShowWelcome → LoginWelcomeStep; si no → motion.div con LoginFormDesktop (hidden md:block) + LoginFormMobile (md:hidden). Objetivo: &lt;150 líneas. |

### Impacto y riesgos

- **Comportamiento**: Idéntico; solo reorganización de código.
- **Riesgo**: Medio (muchos archivos tocados); mitigación: mantener mismos props y flujos, verificación manual de login OTP + welcome.
- **Verificación**: Build, tests existentes, flujo manual login (solicitar acceso → OTP → entrar; welcome móvil → Continuar → formulario).

### Aprobación

Usuario indicó "Sigamos con el siguiente sub bloque" → se considera aprobado el Sub-bloque 2 y se procede a implementación.
