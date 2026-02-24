export type LatLonValidation =
  | { ok: true }
  | { ok: false; reason: string };

export function validateLatLon(lat: number, lon: number): LatLonValidation {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "not-finite" };
  }

  if (lat < -90 || lat > 90) {
    return { ok: false, reason: "lat-out-of-range" };
  }

  if (lon < -180 || lon > 180) {
    return { ok: false, reason: "lon-out-of-range" };
  }

  if (lat === 0 && lon === 0) {
    return { ok: false, reason: "zero-zero" };
  }

  return { ok: true };
}
