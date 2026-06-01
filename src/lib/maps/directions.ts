const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';

type DirectionStop = {
  lng?: number | string | null;
  lat?: number | string | null;
  position?: number | string | null;
};

function normalizeCoordinates(stops: DirectionStop[] = []) {
  return stops
    .filter(
      (stop): stop is Required<Pick<DirectionStop, 'lng' | 'lat'>> & DirectionStop =>
        stop?.lng != null && stop?.lat != null
    )
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((stop) => [Number(stop.lng), Number(stop.lat)]);
}

export async function getRouteDirections(stops: DirectionStop[] = []) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const coordinates = normalizeCoordinates(stops);

  if (!token || coordinates.length < 2) return null;

  const coordinatePath = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url =
    `${DIRECTIONS_BASE}/${coordinatePath}` +
    `?access_token=${token}&geometries=geojson&overview=full&steps=false&language=es`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudo calcular la ruta por carretera');
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) {
    throw new Error('Mapbox no devolvió un trazado válido');
  }

  return {
    type: 'Feature',
    properties: {
      distance: route.distance,
      duration: route.duration,
    },
    geometry: route.geometry,
  };
}
