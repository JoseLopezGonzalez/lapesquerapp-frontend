# Bloque 11: Usuarios y sesiones — STEP 0a y STEP 0

**Fecha**: 2026-02-16

## STEP 0a — Alcance

**Entidades**: Users (usuarios), Sessions (sesiones). Relacionado: Roles (solo getOptions para formularios).

**Artefactos**:
- **Users**: userService.js (list, getById, create, update, delete, getOptions, resendInvitation); entitiesConfig.users; EntityClient + generateColumns (acción Reenviar invitación).
- **Sessions**: sessionService.js (list, getById, create, update, delete, getOptions); entitiesConfig.sessions; EntityClient.
- **Roles**: roleService.js (getOptions). Sin página; usado en filtros y createForm de users.

**Rutas**: /admin/users, /admin/sessions (vía app/admin/[entity]/page.js).

**Tests existentes**: Ninguno para userService, sessionService, roleService.

## STEP 0 — Comportamiento UI actual

**Users**: Listado con filtros (nombre, id, rol, fecha); tabla; acciones Reenviar invitación y Eliminar; sin crear/editar/ver (botones ocultos). Data: EntityClient → userService.list() (useEffect + useState).

**Sessions**: Listado con filtros (id, ids, name); tabla; eliminar; sin crear/editar/ver. Mismo patrón de datos.

**Validación**: Comportamiento alineado con config; no se detectan inconsistencias de negocio. Proceder con mejoras estructurales.
