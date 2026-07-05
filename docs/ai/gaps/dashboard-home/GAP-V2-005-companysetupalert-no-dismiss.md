---
id: GAP-V2-005
title: CompanySetupAlert no tiene ninguna forma de descartarlo — persiste fijo en pantalla toda la sesión
module: dashboard-home
category: ux-ui
priority: P2
risk: low
size: S
status: ready
dependencies: []
target_files:
  - src/components/Admin/Dashboard/CompanySetupAlert.tsx
created_at: 2026-07-05
updated_at: 2026-07-05
---

# GAP-V2-005 — CompanySetupAlert no se puede descartar

## Problema

`src/components/Admin/Dashboard/CompanySetupAlert.tsx:14-41` renderiza una tarjeta
`fixed` sin ningún botón de cierre ni forma de descartarla temporalmente. La única
manera de que desaparezca es completar los campos de empresa que faltan
(`missingFields`, calculados en `useCompanySetupCheck`). Mientras eso no ocurra,
la tarjeta permanece flotando sobre una esquina de la pantalla en **todas** las
sesiones y en todas las páginas donde se monte `Dashboard` (no solo en la carga
inicial), incluso para un usuario que ya vio el aviso y decidió completarlo más
tarde.

No hay:
- botón "X" o ghost/outline de cierre,
- persistencia de "descartado por esta sesión" (`sessionStorage`/sim.),
- ninguna forma de que un administrador con otras prioridades inmediatas oculte el
  aviso sin navegar a `/admin/settings`.

## Objetivo

`CompanySetupAlert` puede descartarse temporalmente (al menos por la sesión de
navegador actual) sin necesidad de completar los datos de empresa, siguiendo el
patrón de affordance de cierre estándar de las tarjetas/toasts del proyecto.

## Contexto

Ninguna dependencia. Relacionado con GAP-V2-004 (mismo componente, problema de
posicionamiento/overflow en mobile) pero es un problema de UX independiente —
puede implementarse en cualquier orden respecto a ese GAP.

## Solución propuesta

1. Añadir un botón de cierre (icono `X` de `lucide-react`, `variant="ghost"`,
   `size="icon"`, con `aria-label="Cerrar aviso"`) en la esquina superior derecha
   de la tarjeta.
2. Al pulsarlo, guardar un flag en `sessionStorage` (p.ej.
   `company_setup_alert_dismissed`) y ocultar la tarjeta para el resto de la
   sesión del navegador.
3. Si `missingFields` cambia (p.ej. otro campo requerido queda incompleto tras
   una edición), no es necesario resetear el flag — el aviso reaparecerá en la
   siguiente sesión de todos modos mientras `isIncomplete` siga siendo `true`.
4. Mantener el comportamiento actual de que el aviso solo se muestra a roles
   `administrador`/`direccion`/`tecnico` con datos incompletos (`useCompanySetupCheck`
   no cambia).

## Criterios de aceptación

- [ ] `CompanySetupAlert` tiene un botón de cierre visible y accesible por teclado.
- [ ] Al cerrarlo, desaparece inmediatamente y no vuelve a aparecer durante la
      misma sesión de navegador (recargar la página no lo trae de vuelta hasta
      cerrar y reabrir el navegador, o el criterio de expiración que se decida).
- [ ] El aviso vuelve a aparecer en una sesión nueva si los datos siguen
      incompletos.
- [ ] `npm run type-check` y `npm run lint` limpios.

## Plan de validación

```text
npm run type-check
npm run lint
# Manual: con datos de empresa incompletos, abrir /admin/home, cerrar el aviso,
# navegar a otra página del admin y confirmar que no reaparece. Cerrar y reabrir
# el navegador (nueva sesión) y confirmar que vuelve a aparecer.
```

## Notas de implementación

{se rellena durante la implementación}

## Resultado

{se rellena al terminar la implementación}

## Resultado de auditoría

{se rellena por gap-auditor}

## Links

- Auditoría de origen: `docs/ai/modules/dashboard-home/audit.md`
- GAPs relacionados: GAP-V2-004
