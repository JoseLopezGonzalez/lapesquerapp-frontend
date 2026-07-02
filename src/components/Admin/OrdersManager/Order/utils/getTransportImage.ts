const TRANSPORT_IMAGES: Record<string, string> = {
  olano: '/images/transports/trailer-olano.png',
  tir: '/images/transports/trailer-tir.png',
  tpo: '/images/transports/trailer-tpo.png',
  distran: '/images/transports/trailer-distran.png',
  narval: '/images/transports/trailer-narval.png',
};

const DEFAULT_IMAGE = '/images/transports/trailer.png';

/**
 * Obtiene la ruta de la imagen del transporte según el nombre
 */
export function getTransportImage(transportName: string | null | undefined): string {
  if (!transportName || typeof transportName !== 'string') return DEFAULT_IMAGE;
  const name = transportName.toLowerCase();
  for (const [key, value] of Object.entries(TRANSPORT_IMAGES)) {
    if (name.includes(key)) return value;
  }
  return DEFAULT_IMAGE;
}
