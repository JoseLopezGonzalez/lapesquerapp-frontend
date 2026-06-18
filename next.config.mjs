/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['mapbox-gl'],
  // WASM support for barcode-detector (ZXing WASM) and @undecaf/zbar-wasm
  // Both scanner backends load .wasm bundles at runtime via dynamic import.
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
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
