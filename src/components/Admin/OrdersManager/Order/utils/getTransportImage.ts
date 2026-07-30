const TRANSPORT_IMAGES: Record<string, string> = {
  olano: '/images/transports/trailer-olano.png',
  tir: '/images/transports/trailer-tir.png',
  tpo: '/images/transports/trailer-tpo.png',
  distran: '/images/transports/trailer-distran.png',
  narval: '/images/transports/trailer-narval.png',
};

const DEFAULT_IMAGE = '/images/transports/trailer.png';
const MARITIME_CONTAINER_IMAGE = '/images/transports/container-40.png';
const MARITIME_CONTAINER_EIMSKIP_IMAGE = '/images/transports/container-40-eimskip.png';

/**
 * Obtiene la ruta de la imagen del transporte según el nombre y el tipo de pedido.
 * Un pedido `maritime_export` siempre se representa con un contenedor de 40 pies
 * (nunca con el trailer normal), con una variante propia cuando el transporte es Eimskip.
 */
export function getTransportImage(
  transportName: string | null | undefined,
  orderType?: string | null
): string {
  const name = typeof transportName === 'string' ? transportName.toLowerCase() : '';

  if (orderType === 'maritime_export') {
    return name.includes('eimskip') ? MARITIME_CONTAINER_EIMSKIP_IMAGE : MARITIME_CONTAINER_IMAGE;
  }

  if (!name) return DEFAULT_IMAGE;
  for (const [key, value] of Object.entries(TRANSPORT_IMAGES)) {
    if (name.includes(key)) return value;
  }
  return DEFAULT_IMAGE;
}
