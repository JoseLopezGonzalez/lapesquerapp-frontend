# Auditoria profunda prospectos comercial en dev

Fecha: 2026-03-24
Ruta analizada: `/comercial/prospectos`
Contexto: en desarrollo, al abrir el apartado de prospectos la vista se queda colgada; el resto del bloque comercial no presenta el mismo comportamiento.

## Resumen ejecutivo

El problema principal no apunta a un bucle evidente de React en runtime, sino a un coste de compilacion y carga inicial desproporcionado en `next dev` para la ruta de prospectos.

La evidencia mas fuerte aparece en los trazos de Next:

- `.next/dev/logs/next-development.log` registra `Compiling /comercial/prospectos ...` con una espera visible mucho mayor que otras pantallas del bloque.
- `.next/dev/trace` muestra una compilacion de `/comercial/prospectos/page` cercana a `12.6s` y un `compile-path` de `~17.1s`.
- En el mismo entorno, `/comercial/clientes/page` aparece con `ensure-page` alrededor de `11227` en el trace, muy por debajo del coste observado en prospectos.

## Evidencias revisadas

### 1. Superficie de entrada

Archivo:

- `src/app/comercial/prospectos/page.js`

Conclusiones:

- la pagina principal es muy fina y delega todo en `ProspectsPageClient`
- no hay logica compleja en el page wrapper

### 2. Cliente principal de prospectos

Archivo:

- `src/components/Comercial/CRM/ProspectsPageClient.jsx`

Conclusiones:

- no se detecta un bucle directo de estado tipo `setState` incondicional en render
- la lista usa `useProspectsList`, filtro local y master-detail
- el detalle solo se monta cuando existe `selectedId`, pero el import era eager
- el modal de alta (`ProspectFormSheet`) tambien se importaba eager aunque estuviera cerrado

Impacto:

- en dev, Turbopack compila todo el arbol importado por la ruta aunque varias piezas no se usen en el primer paint

### 3. Detalle de prospecto

Archivo:

- `src/components/Comercial/CRM/ProspectDetail.jsx`

Conclusiones:

- ya estaba razonablemente optimizado en datos: tabs secundarias con `enabled`, reset de tab al cambiar entidad, carga diferida de contactos/interacciones/ofertas
- no se aprecia aqui la causa principal del cuelgue inicial
- sigue siendo una pieza pesada para el bundle inicial si entra por import estatico

### 4. Formulario de prospecto

Archivo:

- `src/components/Comercial/CRM/ProspectFormSheet.jsx`

Conclusiones:

- el formulario no dispara catalogos estando cerrado: `useCountriesList({ enabled: open })`
- aun asi mete en el bundle inicial dependencias de dialog, date picker, scroll area y formulario completo
- esto penaliza especialmente la primera compilacion de la ruta en dev

### 5. Hooks CRM

Archivo:

- `src/hooks/useProspects.ts`

Conclusiones:

- no se detecta un ciclo obvio de invalidacion infinita
- el hook de lista devuelve `meta` razonable por defecto
- la query de lista no estaba normalizada con helper compartido, pero eso no explica por si solo el cuelgue inicial del apartado

## Hipotesis raiz

La causa mas probable del “cuelgue” en dev era una combinacion de:

1. Bundle inicial de `/comercial/prospectos` demasiado ancho para una ruta que en el primer paint no necesita ni el sheet de alta ni el detalle completo.
2. Compilacion eager de subarboles caros (`ProspectFormSheet`, `ProspectDetail`) al entrar en la ruta.
3. Sensibilidad de `next dev`/Turbopack a rutas con arboles mas grandes, haciendo que la experiencia percibida sea de bloqueo aunque no exista un loop de React.

## Cambios aplicados

### Code splitting del apartado prospectos

Archivo:

- `src/components/Comercial/CRM/ProspectsPageClient.jsx`

Cambio:

- `ProspectFormSheet` pasa a `dynamic(...)` con carga diferida y sin SSR
- `ProspectDetail` pasa a `dynamic(...)` con loader y sin SSR

Objetivo:

- reducir el coste de compilacion/carga inicial al abrir `/comercial/prospectos`
- dejar fuera del bundle inicial lo que no se necesita hasta abrir modal o seleccionar un prospecto

### Code splitting del detalle standalone

Archivo:

- `src/app/comercial/prospectos/[id]/page.js`

Cambio:

- `ProspectDetail` se carga con `dynamic(...)` y fallback de `Loader`

Objetivo:

- mantener el mismo criterio en la ruta de detalle movil

## Riesgos residuales

- el trace confirma que habia una penalizacion clara en compilacion, pero no sustituye una reproduccion visual completa autenticada navegando desde el navegador
- si aun se percibe bloqueo tras este ajuste, el siguiente sospechoso es el coste de autenticacion/sesion y la cascada de requests CRM al hidratar el layout comercial
- tambien conviene revisar si el propio backend de `prospects` responde mas lento que otros endpoints del bloque

## Siguientes pasos recomendados

1. Probar en navegador autenticado abrir `/comercial/prospectos` con el servidor dev ya levantado.
2. Comparar Network de:
   - `/comercial/prospectos`
   - `/comercial/clientes`
3. Si persiste lentitud, medir:
   - tiempo hasta primer RSC de la ruta
   - tiempo de `/api/auth/session`
   - tiempo de `/api-backend/api/v2/prospects`
4. Como segunda ronda, valorar lazy-load interno adicional en acciones del detalle si sigue siendo necesario.
