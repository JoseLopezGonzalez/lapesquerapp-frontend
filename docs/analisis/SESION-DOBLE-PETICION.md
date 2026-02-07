# Por qué se pide la sesión dos veces (`GET /api/auth/session`)

## Qué se observa

En el HAR, al abrir una página (p. ej. el gestor de pedidos), aparecen **dos** peticiones a `GET /api/auth/session`. Eso provoca que todos los efectos que dependen de `token` (OrdersManager, contextos de opciones, SettingsProvider) se ejecuten dos veces y, por tanto, que también se dupliquen peticiones a orders/active, products/options, suppliers/options, settings.

## Quién hace la petición de sesión

La petición a `/api/auth/session` la dispara **SessionProvider** de NextAuth (y, en su caso, sus refetches automáticos).  
Los muchos **useSession()** del árbol (admin layout, OrdersManager, hooks, etc.) **no** generan una petición cada uno: leen el estado de sesión desde React Context. Solo el provider hace (o desencadena) el fetch.

## Causas probables de las dos peticiones

### 1. refetchOnWindowFocus (NextAuth por defecto: true) — **causa más probable**

Next.js tiene **Strict Mode** activo por defecto. En desarrollo, React monta el árbol de componentes, lo desmonta y lo vuelve a montar para detectar efectos secundarios.  
**SessionProvider** monta dos veces → en cada montaje hace una petición inicial a `/api/auth/session` → se ven **dos GET** en la misma carga.  
En **producción** Strict Mode no hace este doble montaje, así que ahí solo se esperaría una petición inicial (salvo refetch por otras causas).

### 2. React Strict Mode (desarrollo)

SessionProvider, por defecto, **vuelve a pedir la sesión cuando la ventana o pestaña recupera el foco** (`refetchOnWindowFocus={true}`).  
Si al cargar la página se dispara un evento de foco (p. ej. el navegador considera que la pestaña “gana” foco tras la carga), puede producirse un **segundo** GET a `/api/auth/session` además del inicial.

### 3. Un solo SessionProvider

En el código solo hay **un** `SessionProvider` en `src/app/ClientLayout.js`. No hay doble provider que justifique dos peticiones por duplicación de árbol.

## Resumen

- La causa que mejor explica las **dos** peticiones (en dev y en prod) es **refetchOnWindowFocus**: el refetch al ganar foco de la pestaña justo después de la carga. En desarrollo puede sumarse **Strict Mode** (doble montaje).
- Los muchos **useSession()** no son la causa directa; comparten el mismo estado vía contexto.
- **Causa raíz** → sesión pedida dos veces → efectos con `[token]` se ejecutan dos veces → se duplican peticiones a orders/active, products/options, suppliers/options, settings.

## Mitigaciones posibles

1. **Desactivar refetch al ganar foco (recomendado si el doble request molesta)**  
   En `src/app/ClientLayout.js`, pasar **`refetchOnWindowFocus={false}`** a `<SessionProvider>`. Con eso se evita el segundo GET que dispara el foco de la pestaña al cargar (y al cambiar de pestaña y volver).  
   Efecto secundario: al cambiar de pestaña y volver, la sesión no se actualizará sola (p. ej. si caducó en otra pestaña). Para muchas apps es aceptable.

2. **Aceptar doble petición en desarrollo**  
   Con Strict Mode activo, es **esperable** ver dos peticiones de sesión (y por tanto dos de orders/active, etc.) en desarrollo. En producción no se aplica el doble montaje.

3. **No desactivar Strict Mode**  
   Desactivar Strict Mode solo para evitar la doble petición no es recomendable; Strict Mode ayuda a detectar bugs. Es preferible documentar el comportamiento y, si se quiere reducir peticiones, usar `refetchOnWindowFocus={false}`.

## Referencias

- NextAuth: [SessionProvider – Refetch On Window Focus](https://next-auth.js.org/getting-started/client#refetch-on-window-focus)
- React: [Strict Mode – Detecting unexpected side effects](https://react.dev/reference/react/StrictMode)
- Análisis relacionado: `docs/analisis/ANALISIS_OrdersManager.md` (sección “Por qué hay dos llamadas a orders/active”)
