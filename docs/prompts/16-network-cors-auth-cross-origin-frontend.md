# Network, CORS, auth y cross-origin en el frontend

## Objetivo

Integrar en el circuito del frontend el criterio operativo para diagnosticar problemas de red, auth browser-side y comunicación cross-origin.

Este documento no sustituye la guía principal. Se usa como anexo operativo dentro del circuito.

## Cuándo usarlo

Usarlo siempre que aparezca alguno de estos síntomas:

- fallo en preflight `OPTIONS`
- error CORS en consola
- cookies de sesión no llegan o no persisten
- pérdida de sesión al cambiar de subdominio o dominio
- `Origin` no permitido
- backend responde distinto a lo que el navegador exige
- `Authorization` o `X-Tenant` faltan o bloquean la request
- tenant incorrecto por resolución de host
- diferencias entre entorno local, staging y producción

## Relación con el circuito principal

- La auditoría principal debe remitir aquí cuando detecte riesgos de integración frontend-backend.
- La implementación por bloques debe abrir este documento cuando el bloque toque auth flow, cookies, dominios, subdominios o llamadas cross-origin.
- La fuente de verdad del circuito debe reflejar estos riesgos dentro del bloque correspondiente, normalmente:
  - `Auth, sesión y autorización`
  - `Integración backend, multi-tenant y cross-origin`

## Qué cubre este documento

### 1. Responsabilidad del frontend

El frontend sí es responsable de:

- llamar a la URL correcta
- resolver correctamente tenant y dominio
- enviar cabeceras esperadas
- no romper el auth flow en navegador
- entender si usa cookies, bearer token o ambos
- diferenciar problemas del navegador de problemas del backend o proxy

El frontend no arregla por sí solo:

- un backend que no responde con headers CORS válidos
- un proxy que corta `OPTIONS` o reescribe mal headers
- cookies mal configuradas en dominio, `SameSite`, `Secure` o path

### 2. Qué revisar primero en este repo

- `src/lib/fetchWithTenant.js`
- `src/lib/utils/getCurrentTenant.ts`
- `src/configs/config.js`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts`
- cualquier hook o servicio del flujo afectado que componga queries con tenant o token

### 3. Checklist de diagnóstico

#### A. URL, dominio y tenant

- qué host ve el navegador
- qué tenant resuelve `getCurrentTenant`
- qué base URL usa la app
- si la request sale contra el dominio esperado

#### B. Cabeceras y auth

- si la request lleva `Authorization`
- si lleva `X-Tenant`
- si el backend espera cookies además de token
- si la request es simple o fuerza preflight

#### C. Cookies y sesión

- si la cookie existe
- si el dominio de la cookie coincide con el escenario real
- si `Secure` y `SameSite` encajan con el entorno
- si la pérdida de sesión viene del navegador, del middleware o del backend

#### D. Preflight y CORS

- si el navegador envía `OPTIONS`
- si el backend o proxy responde con:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`
- si la respuesta falla antes de llegar al POST/GET real

#### E. Proxy o infraestructura

- si nginx, CDN o proxy responden distinto a Laravel
- si hay cache de respuestas `OPTIONS`
- si staging y producción difieren en headers o dominios

## Cómo documentar hallazgos en el circuito

Cuando un problema caiga aquí, no dejarlo como nota aislada.

Hay que:

1. reflejarlo en la auditoría del bloque afectado
2. actualizar en la fuente central:
   - `gap_principal`
   - `notas_provisionales`
   - `dependencias_o_riesgos`
3. decidir si es un problema de:
   - frontend
   - backend/proxy
   - contrato compartido

## Casos típicos

### Caso 1. Login bloqueado por CORS

Síntomas:

- consola con error CORS
- `POST` no sale o falla tras `OPTIONS`

Lectura:

- revisar frontend para confirmar URL y headers esperados
- si el navegador bloquea por falta de `Access-Control-Allow-Origin`, el arreglo principal estará en backend/proxy

### Caso 2. Sesión perdida entre subdominios

Síntomas:

- login parece correcto
- refresco o navegación cambia el estado de sesión

Lectura:

- revisar cookies, dominio, `SameSite`, `Secure`, middleware y tenant resuelto

### Caso 3. Tenant incorrecto

Síntomas:

- datos de otro tenant
- 401/403 inesperados
- cache no alineada con subdominio

Lectura:

- revisar host, `getCurrentTenant`, query keys tenant-aware y composición de headers

## Documento histórico absorbido

El troubleshooting aislado de CORS en producción se ha absorbido aquí como parte del circuito. Su versión histórica queda archivada en:

- `docs/troubleshooting/antiguos/00-cors-auth-production.md`

## Regla final

Si el problema parece de auth o permisos pero aparece solo en navegador, trátalo también como posible problema cross-origin hasta descartarlo.
