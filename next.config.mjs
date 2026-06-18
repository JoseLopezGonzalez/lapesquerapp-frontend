/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['mapbox-gl'],
  // Next.js 16 uses Turbopack by default. Both WASM scanner packages
  // (barcode-detector / @undecaf/zbar-wasm) load their .wasm files via
  // internal fetch() at runtime — no static .wasm imports — so Turbopack
  // handles them without special config. An empty turbopack key here tells
  // Next.js we are aware of Turbopack and intentionally have no overrides.
  turbopack: {},
  // Eliminar console.log/info/debug en producción (mantener error/warn)
  // Nota: con Turbopack puede no aplicarse; verificar con build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // En desarrollo, proxy al backend para evitar CORS (navegador → mismo origen → Next reenvía a :8000)
  async rewrites() {
    const rules = [
      { source: '/api-backend/:path*', destination: 'http://localhost:8000/:path*' },
      // En modo generic el favicon es .png; redirigir .ico a .png para evitar 404 (builds antiguos o petición por defecto)
      { source: '/favicon-generic.ico', destination: '/favicon-generic.png' },
    ];
    return rules;
  },
};

export default nextConfig;
