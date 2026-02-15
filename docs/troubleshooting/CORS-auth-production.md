# CORS en producción: login / request-access bloqueado

## Síntoma

En producción, al solicitar acceso (login) desde `https://brisamar.lapesquerapp.es`:

- **Consola del navegador**:  
  `Access to fetch at 'https://api.lapesquerapp.es/api/v2/auth/request-access' from origin 'https://brisamar.lapesquerapp.es' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

- **Red**: la petición POST falla (a menudo aparece como `net::ERR_FAILED`). Antes del POST, el navegador envía una petición **OPTIONS** (preflight); es esa respuesta la que no incluye los headers CORS.

## Causa (resumen)

El **frontend Next.js** no hace nada especial con CORS: solo llama a la API con `fetch` desde el navegador.  
Quien debe enviar los headers CORS es **solo el backend Laravel** (y, si aplica, el proxy delante de él).

- Origen del frontend: `https://brisamar.lapesquerapp.es`
- URL de la API: `https://api.lapesquerapp.es/api/v2/auth/request-access`
- El cliente envía headers personalizados (`X-Tenant`, `Content-Type`, etc.) → el navegador **siempre** hace una petición **OPTIONS** (preflight) antes del POST.
- Si la respuesta a OPTIONS (o a POST) **no** incluye `Access-Control-Allow-Origin` (y el resto de headers CORS necesarios), el navegador bloquea la petición.

Por tanto, el fallo **no es del .env del frontend** ni de un commit reciente del frontend que “lo dejara distinto”: el comportamiento del cliente (qué URL llama y qué headers envía) es el esperado. El problema está en la **respuesta del servidor** (API Laravel o lo que responda en `api.lapesquerapp.es`).

## Qué comprobar en el backend (Laravel / API)

Todo esto se hace en el **repositorio del backend** (Laravel), no en brisapp-nextjs.

### 1. CORS en Laravel

- **Paquete**: que el proyecto use el paquete oficial de CORS (p. ej. `fruitcake/laravel-cors` o el soporte integrado en Laravel).
- **Configuración**: en `config/cors.php` (o equivalente) debe:
  - Permitir el **origen** `https://brisamar.lapesquerapp.es` (y los demás subdominios que usen el frontend).
  - Permitir los **métodos** que use el cliente: al menos `GET`, `POST`, `OPTIONS` (y `PUT`, `DELETE` si los usas).
  - Permitir los **headers** que envía el frontend: como mínimo `X-Tenant`, `Content-Type`, `Authorization` (si se usa), `Accept`.
- **Variables de entorno**: si usas algo como `CORS_ALLOWED_ORIGINS`, comprobar que:
  - Esté definida en el `.env` del **servidor donde corre la API** (producción).
  - El valor sea exactamente el que usa el frontend, p. ej.  
    `CORS_ALLOWED_ORIGINS=https://brisamar.lapesquerapp.es,https://pymcolorao.lapesquerapp.es,...`  
    (sin espacios extra, sin `http://` donde el sitio sea `https://`).

### 2. Rutas y middleware

- Las rutas que atienden `/api/v2/auth/request-access` (y en general `/api/v2/*`) deben estar cubiertas por el **middleware de CORS** (normalmente el middleware global de CORS de Laravel).
- El orden del middleware importa: CORS debe ejecutarse **antes** de cualquier middleware que rechace la petición o devuelva 401/403 sin añadir headers CORS. Si OPTIONS llega a un middleware que responde 404 o 401 sin headers CORS, el navegador verá “No 'Access-Control-Allow-Origin' header”.

### 3. Petición OPTIONS (preflight)

- El navegador envía **OPTIONS** a la misma URL que el POST (p. ej. `OPTIONS https://api.lapesquerapp.es/api/v2/auth/request-access`).
- El servidor debe:
  - Responder a **OPTIONS** con **200** (o 204) y con los headers CORS correctos, **o**
  - Dejar que Laravel maneje OPTIONS y que el middleware CORS añada los headers.
- Si delante de Laravel hay **nginx** (u otro proxy):
  - No debe “tragarse” OPTIONS y responder sin headers CORS.
  - Debe reenviar OPTIONS a Laravel para que sea Laravel (y su middleware CORS) quien responda, **o**
  - Si nginx responde directamente a OPTIONS, debe añadir los mismos headers CORS que exige el navegador (como mínimo `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`).

### 4. Comprobar en el servidor

En el servidor donde corre la API (o desde una máquina con acceso):

```bash
# Preflight (OPTIONS): debe devolver 200 y headers CORS
curl -i -X OPTIONS "https://api.lapesquerapp.es/api/v2/auth/request-access" \
  -H "Origin: https://brisamar.lapesquerapp.es" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Tenant, Content-Type"
```

En la respuesta debe aparecer algo como:

- `Access-Control-Allow-Origin: https://brisamar.lapesquerapp.es` (o el valor configurado)
- `Access-Control-Allow-Methods: ...` (incluyendo POST, OPTIONS)
- `Access-Control-Allow-Headers: ...` (incluyendo X-Tenant, Content-Type)

Si en esta respuesta **no** aparece `Access-Control-Allow-Origin`, el fallo está en la API o en el proxy, no en el frontend.

### 5. Cache y despliegue

- Tras cambiar `config/cors.php` o variables de entorno en Laravel:
  - Ejecutar `php artisan config:clear` (y si usas cache de config, `php artisan config:cache`).
  - Reiniciar PHP-FPM / el proceso que sirve la API.
- Si hay CDN o proxy con cache (Cloudflare, etc.), comprobar que no esté cacheando la respuesta OPTIONS con headers antiguos (o excluir OPTIONS del cache).

## Sobre el .env del frontend (Next.js)

En producción, el frontend usa:

- `NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_BASE_URL` (si no está definido, el código usa por defecto `https://api.lapesquerapp.es`).

Eso solo define **a qué URL** llama el navegador. No influye en los headers que devuelve la API.  
Por tanto, que el login “no vaya” por CORS **no se soluciona** cambiando el .env del frontend: hay que corregir la respuesta CORS del backend (y/o del proxy).

## Sobre el banner PWA (“Banner not shown: beforeinstallprompt...”)

Es un mensaje aparte: el navegador avisa de que se llamó a `beforeinstallprompt.preventDefault()` pero no se llegó a llamar a `prompt()` para mostrar el banner de instalación. No tiene relación con el error de CORS; se puede tratar por separado (mostrar el banner cuando quieras o no llamar a `preventDefault()` si no vas a usarlo).

## Resumen de opciones

| Dónde | Qué hacer |
|-------|-----------|
| **Backend (Laravel)** | Revisar `config/cors.php`, `CORS_ALLOWED_ORIGINS` en .env de producción, que las rutas `/api/v2/*` pasen por el middleware CORS y que OPTIONS responda 200 con headers CORS. |
| **Proxy (nginx, etc.)** | Asegurar que OPTIONS llegue a Laravel o que el proxy responda a OPTIONS con los headers CORS correctos. |
| **Frontend (Next.js)** | No es necesario cambiar la lógica ni el .env para “arreglar” este CORS; el frontend ya llama a la URL correcta y envía los headers esperados. |

Si en un commit anterior “funcionaba”, lo más probable es que en el servidor de la API (o en el proxy) se haya cambiado la configuración CORS, se haya dejado de cargar `CORS_ALLOWED_ORIGINS`, o se esté cacheando una respuesta OPTIONS sin headers. Revisar el backend y el proxy con el checklist anterior suele ser suficiente para resolverlo.
