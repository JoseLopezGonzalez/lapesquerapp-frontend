# Manejo de Errores de Autenticación

## Problema Resuelto

Cuando la sesión del usuario caducaba, la aplicación mostraba errores en la consola y se quedaba cargando indefinidamente en lugar de redirigir al usuario al login.

## Solución Implementada

Se ha implementado un sistema global de manejo de errores de autenticación que:

1. **Detecta automáticamente** errores de autenticación (401, 403, "No autenticado", etc.)
2. **Muestra una notificación** al usuario informando que la sesión ha expirado
3. **Cierra la sesión** automáticamente
4. **Redirige al login** preservando la página actual para volver después del login

## Componentes Principales

### 1. AuthErrorInterceptor (`src/components/Utilities/AuthErrorInterceptor.js`)
- Intercepta errores de fetch globalmente
- Maneja errores de JavaScript no capturados
- Muestra notificaciones al usuario
- Coordina el cierre de sesión y redirección

### 2. Configuración Centralizada (`src/configs/authConfig.js`)
- Define mensajes de error de autenticación
- Configura tiempos de redirección
- Proporciona funciones utilitarias para detectar errores

### 3. fetchWithTenant Mejorado (`src/lib/fetchWithTenant.js`)
- Detecta errores de autenticación en respuestas HTTP
- Lanza errores específicos para autenticación
- Mejora el logging de errores

### 4. Middleware Actualizado (`src/middleware.js`)
- Mejor logging con emojis para identificación
- Manejo consistente de errores de autenticación
- Redirección preservando la página actual

## Flujo de Funcionamiento

1. **Usuario navega** a una página protegida
2. **SettingsContext** intenta cargar configuración
3. **API devuelve 401** si la sesión expiró
4. **fetchWithTenant** detecta el error y lanza "No autenticado"
5. **AuthErrorInterceptor** captura el error globalmente
6. **Se muestra notificación** "Sesión expirada. Redirigiendo al login..."
7. **Se cierra la sesión** automáticamente
8. **Se redirige al login** con parámetro `from` para volver después

## Beneficios

- ✅ **Experiencia de usuario mejorada**: No más pantallas de carga infinitas
- ✅ **Feedback claro**: El usuario sabe qué está pasando
- ✅ **Redirección automática**: No requiere intervención manual
- ✅ **Preservación de contexto**: Vuelve a la página donde estaba
- ✅ **Logging mejorado**: Fácil debugging con emojis y mensajes claros
- ✅ **Configuración centralizada**: Fácil mantenimiento y modificación

## Configuración

Los parámetros se pueden ajustar en `src/configs/authConfig.js`:

```javascript
export const AUTH_ERROR_CONFIG = {
  REDIRECT_DELAY: 1500,        // Tiempo antes de redirigir
  DEFAULT_LOGIN_URL: '/',      // URL de login
  FROM_PARAM: 'from'           // Parámetro para guardar página actual
};
```

## Uso

El sistema se activa automáticamente al incluir `AuthErrorInterceptor` en el `ClientLayout`. No requiere configuración adicional en componentes individuales.
