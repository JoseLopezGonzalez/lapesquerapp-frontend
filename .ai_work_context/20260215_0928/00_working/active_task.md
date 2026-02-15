# Tarea activa

**Estado**: Pendiente de indicación  
**Última actualización**: 2026-02-15

## Tarea

Evolución frontend Next.js (incremental y segura), guiada por:
- `docs/audits/nextjs-frontend-global-audit.md`
- Prompt: `docs/prompts/02_Nextjs frontend evolution prompt.md`

**Pendiente**: El usuario debe indicar **qué módulo/bloque** quiere abordar primero (ej. Ventas, Stock, Productos, Auth, Clientes, Reportes, Config).

## Fase actual

- Bloque elegido: **Auth**. Alcance confirmado por el usuario.
- STEP 0 completado: comportamiento UI en `01_analysis/auth-step0-ui-behavior.md`.
- STEP 1 completado: análisis en `01_analysis/auth-step1-analisis.md` — **Rating antes: 4/10**.
- STEP 2 completado: propuesta detallada del **Sub-bloque 1** en `02_planning/auth-step2-proposed-changes.md`.
- Sub-bloque 1 **aprobado e implementado**: authService TypeScript, tipos auth, tests authService y authConfig.
- **Rating después (bloque Auth)**: 6,5/10 (Sub-bloque 2 completado).
- Sub-bloque 2 completado: LoginPage dividida en hooks, util, subcomponentes. index.js 108 líneas.
- Sub-bloque 3 completado: Zod + react-hook-form en login (schemas, useForm en LoginPage, LoginFormContent con register/Controller, useLoginActions con datos del form) y validación Zod del token en auth/verify.
- **Sub-bloque 4 completado**: Migración a TypeScript del resto del bloque Auth (middleware, NextAuth route, authConfig/roleConfig, lib/auth, getCurrentTenant, loginUtils; AdminRouteProtection, ProtectedRoute, AuthErrorInterceptor, LogoutDialog, LogoutContext, useIsLoggingOut, LoginPage y subcomponentes, auth/verify). **Rating después: 8/10.**
- **Mejoras P2 completadas**: getAuthToken documentado (sin logs); ProtectedRoute documentado como no usado/disponible; middleware usa logger (devLog para "Token inválido...", logError para errores reales) para reducir logs en producción.

## Próximo paso

1. Usuario indica: siguiente bloque del plan de evolución u otras mejoras opcionales del Auth (p. ej. useLoginTenant/useLoginActions a TS).
