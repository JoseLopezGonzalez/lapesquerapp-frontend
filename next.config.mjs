/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Eliminar console.log/info/debug en producción (mantener error/warn)
  // Nota: con Turbopack puede no aplicarse; verificar con build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  // En desarrollo, proxy al backend para evitar CORS (navegador → mismo origen → Next reenvía a :8000)
  async rewrites() {
    return [
      { source: '/api-backend/:path*', destination: 'http://localhost:8000/:path*' },
    ];
  },
};

export default nextConfig;
