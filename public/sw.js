/**
 * Service Worker - PWA
 * 
 * Cache básico para estáticos y navegación.
 * Alcance: Solo lectura de pantallas recientes / listas cacheadas.
 * Operaciones críticas (crear, editar, eliminar) requieren red.
 * 
 * Estrategias:
 * - Estáticos (JS/CSS/fonts): Cache-first con fallback a network
 * - Páginas HTML: Network-first con fallback a cache
 * - API calls: Network-first (operaciones críticas requieren red)
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const NAVIGATION_CACHE = `navigation-${CACHE_VERSION}`;

// Assets estáticos a cachear en la instalación (solo rutas que existan en el deploy actual).
// En generic solo existen -generic; en pesquerapp solo existen /pesquerapp/*. No precachear todos para evitar 404 en addAll.
const STATIC_ASSETS = ['/'];

// Tipos de archivos estáticos
const STATIC_FILE_EXTENSIONS = [
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.webp',
  '.ico',
];

/**
 * Instalación del Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Añadir uno a uno para que un 404 (ej. favicon-genérico no creado) no rompa la instalación
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
        );
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Error during installation:', error);
      })
  );
});

/**
 * Activación del Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos que no coincidan con la versión actual
            if (cacheName !== STATIC_CACHE && cacheName !== NAVIGATION_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control inmediatamente de todas las páginas
        return self.clients.claim();
      })
  );
});

/**
 * Interceptar requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests de extensiones del navegador
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Ignorar requests de APIs (siempre network-first)
  if (url.pathname.startsWith('/api/')) {
    // API calls siempre usan network
    event.respondWith(fetch(request));
    return;
  }

  // Estrategia para assets estáticos: Cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Estrategia para navegación (HTML): Network-first con fallback a cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, NAVIGATION_CACHE));
    return;
  }

  // Por defecto, network-first
  event.respondWith(networkFirst(request, NAVIGATION_CACHE));
});

/**
 * Verificar si es un asset estático
 */
function isStaticAsset(pathname) {
  return STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Estrategia Cache-first
 * Usar para: JS, CSS, fonts, imágenes
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    
    // Si todo falla, intentar devolver del cache aunque esté desactualizado
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Estrategia Network-first con fallback a cache
 * Usar para: Páginas HTML, navegación
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Si no hay cache y estamos offline, devolver página offline básica
    return new Response('Offline - Contenido no disponible', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

