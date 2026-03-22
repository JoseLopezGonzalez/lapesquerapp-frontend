function openExternal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openInGoogleMaps(lat, lng, query) {
  const hasCoordinates =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  if (!hasCoordinates && !query?.trim()) {
    return;
  }

  const destination = hasCoordinates
    ? `${Number(lat)},${Number(lng)}`
    : encodeURIComponent(query.trim());
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  openExternal(url);
}

export function openInWaze(lat, lng, query) {
  const hasCoordinates =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  if (!hasCoordinates && !query?.trim()) {
    return;
  }

  if (hasCoordinates) {
    const url = `https://waze.com/ul?ll=${Number(lat)},${Number(lng)}&navigate=yes`;
    openExternal(url);
    return;
  }

  const url = `https://waze.com/ul?q=${encodeURIComponent(query.trim())}&navigate=yes`;
  openExternal(url);
}
