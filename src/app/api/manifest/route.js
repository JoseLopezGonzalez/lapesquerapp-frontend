/**
 * Sirve el PWA manifest de forma dinámica según el branding y el tenant (Host header).
 * El layout enlaza con <link rel="manifest" href="/api/manifest" />.
 */

import {
  manifestName,
  manifestShortName,
  manifestDescription,
  icon192Path,
  icon512Path,
  appleTouchIconPath,
  isGenericBranding,
} from '@/configs/branding';

function getTenantFromHost(host) {
  if (!host) return null;
  const parts = host.split('.');
  const isLocal = host.includes('localhost');
  if (isLocal) {
    return parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null;
  }
  return parts[0] ?? null;
}

function buildManifestNames(tenant) {
  if (isGenericBranding) {
    return { name: manifestName, short_name: manifestShortName };
  }
  if (tenant === 'superadmin') {
    return { name: 'La PesquerApp Superadmin', short_name: 'SA Admin' };
  }
  if (tenant) {
    const displayName = tenant.charAt(0).toUpperCase() + tenant.slice(1);
    return { name: `La PesquerApp — ${displayName}`, short_name: displayName };
  }
  return { name: manifestName, short_name: manifestShortName };
}

export function GET(request) {
  const host = request.headers.get('host') ?? '';
  const tenant = getTenantFromHost(host);
  const { name, short_name } = buildManifestNames(tenant);

  const manifest = {
    name,
    short_name,
    description: manifestDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait-primary',
    icons: [
      {
        src: icon192Path,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: icon512Path,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: appleTouchIconPath,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
