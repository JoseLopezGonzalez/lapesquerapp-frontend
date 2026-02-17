# Especificación: GET /api/v2/settings para todos los roles

## Contexto

El endpoint `GET /api/v2/settings` devuelve **403** para el rol **operario** con:

```json
{
  "message": "This action is unauthorized.",
  "userMessage": "No tienes permiso para realizar esta acción.",
  "error": "This action is unauthorized."
}
```

El frontend necesita **leer** settings (por ejemplo `company.name`, logo, etc.) en pantallas usadas por **todos los roles**, incluido operario (sidebar, cabecera, mapas, etc.). Si el backend deniega la lectura por rol, esas vistas quedan sin datos de empresa o con fallbacks genéricos.

## Requisito

- **GET /api/v2/settings** debe estar permitido para **cualquier usuario autenticado**, con **cualquier rol** (incluido `operario`).
- Solo hace falta **lectura** para todos; la **escritura** puede seguir restringida.
- **PUT /api/v2/settings** puede seguir restringido a administrador/superuser según la política actual.

## Implementación en el backend (Laravel)

1. **Controlador o policy de Settings**
   - Ajustar la autorización para que el método que responde a `GET /api/v2/settings` permita acceso a cualquier usuario autenticado (p. ej. `auth()->check()` o policy `view` que devuelva `true` para cualquier rol).
   - El método que responde a `PUT /api/v2/settings` puede seguir comprobando rol (p. ej. solo `administrador` o `superuser`).

2. **Ejemplo de lógica**
   - **Ver/Index (GET):** permitir si `$request->user()` existe.
   - **Update (PUT):** permitir solo si el usuario tiene rol permitido (p. ej. `administrador`, `superuser`).

3. **Respuesta**
   - No cambiar el formato de la respuesta; el frontend ya consume el JSON de settings (objeto plano clave-valor o con `data` según el contrato actual).

## Resumen

| Método | Ruta               | Quién debe poder acceder        |
|--------|--------------------|----------------------------------|
| GET    | /api/v2/settings   | Todos los roles autenticados    |
| PUT    | /api/v2/settings   | Según política actual (ej. admin) |

## Referencia en este repo

- Frontend: `src/services/settingsService.ts` (`getSettings`), `src/hooks/useSettingsData.js`, `SettingsContext`; usos en SideBar, AdminLayoutClient, OrderMap, etc.
- API ref: `docs/API-references/sistema/README.md` → sección Configuración.
