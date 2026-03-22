const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export function hasMapboxToken() {
  return Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
}

export async function geocodeAddress(query) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token || !query?.trim()) return [];

  const url = `${GEOCODING_BASE}/${encodeURIComponent(query)}.json?access_token=${token}&language=es&country=ES&limit=5`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al buscar la dirección');
  }
  const data = await response.json();
  return data?.features ?? [];
}
