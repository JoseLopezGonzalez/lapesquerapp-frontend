# Desarrollo local: Next.js con Webpack (alternativa a Turbopack)

## Cuándo usar esto

En este proyecto, con **Turbopack** (`next dev` por defecto en muchos entornos) puede ocurrir que al entrar en rutas del rol comercial como **`/comercial/prospectos`** o **`/comercial/rutas`** la compilación en dev **se alargue mucho o parezca colgada**. Suele estar relacionado con el tamaño del grafo de dependencias (por ejemplo **Mapbox** en el planificador de rutas y el CRM en prospectos).

Si pasa eso, arranca el servidor de desarrollo **con Webpack** en lugar de Turbopack.

## Comando (añadir a mano)

No hace falta cambiar `package.json`: puedes ejecutar:

```bash
npx next dev --webpack
```

Opcionalmente con puerto u host explícitos, por ejemplo:

```bash
npx next dev --webpack -p 3000
```

## Qué esperar

- **El arranque puede tardar más** que con Turbopack; es normal.
- A cambio, suele **completarse** la compilación de Prospectos y Rutas y poder entrar en esas vistas (aunque la primera visita tras arrancar siga siendo la más lenta).

## Si sigue costando mucho

- Aumentar memoria de Node, por ejemplo:

  ```bash
  NODE_OPTIONS=--max-old-space-size=8192 npx next dev --webpack
  ```

- Trabajar con el proyecto en el **filesystem de WSL** (`/home/...`), no en `/mnt/c/...`, para I/O más rápida al compilar.

## Referencia técnica (resumen)

- Rutas comerciales pesadas: `RoutesPlannerPage` importa `RouteMap` → `react-map-gl` / `mapbox-gl`.
- En `next.config.mjs` está `transpilePackages: ['mapbox-gl']`, lo que incrementa el trabajo de compilación en dev.

Para una mejora estructural a futuro (menos carga inicial en Rutas), se puede valorar cargar el mapa con `next/dynamic` y `ssr: false`; eso sería un cambio de código aparte.
