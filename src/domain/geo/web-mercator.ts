const R = 6378137;
const MAX_LAT = 85.05112878;

function clampLat(lat: number): number {
  if (lat > MAX_LAT) {
    return MAX_LAT;
  }

  if (lat < -MAX_LAT) {
    return -MAX_LAT;
  }

  return lat;
}

export function lonLatToWebMercatorMeters(
  lon: number,
  lat: number,
): { x: number; y: number } {
  const clampedLat = clampLat(lat);
  const lonRad = (lon * Math.PI) / 180;
  const latRad = (clampedLat * Math.PI) / 180;

  const x = R * lonRad;
  const y = R * Math.log(Math.tan(Math.PI / 4 + latRad / 2));

  return { x, y };
}

export function webMercatorMetersToLonLat(
  x: number,
  y: number,
): { lon: number; lat: number } {
  const lon = (x / R) * (180 / Math.PI);
  const lat =
    (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);

  return {
    lon,
    lat: clampLat(lat),
  };
}
