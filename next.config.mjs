/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // En desarrollo, proxy al backend para evitar CORS (navegador → mismo origen → Next reenvía a :8000)
  async rewrites() {
    return [
      { source: '/api-backend/:path*', destination: 'http://localhost:8000/:path*' },
    ];
  },
};

export default nextConfig;
