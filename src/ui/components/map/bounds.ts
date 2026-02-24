import type { Occurrence } from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

export type BoundsResult = {
  southWest: [number, number];
  northEast: [number, number];
};

export function computeBounds(occurrences: Occurrence[]): BoundsResult | null {
  const validOccurrences = occurrences.filter((occurrence) =>
    validateLatLon(occurrence.lat, occurrence.lon).ok,
  );

  if (validOccurrences.length === 0) {
    return null;
  }

  let minLat = validOccurrences[0].lat;
  let maxLat = validOccurrences[0].lat;
  let minLon = validOccurrences[0].lon;
  let maxLon = validOccurrences[0].lon;

  for (const occurrence of validOccurrences) {
    if (occurrence.lat < minLat) minLat = occurrence.lat;
    if (occurrence.lat > maxLat) maxLat = occurrence.lat;
    if (occurrence.lon < minLon) minLon = occurrence.lon;
    if (occurrence.lon > maxLon) maxLon = occurrence.lon;
  }

  return {
    southWest: [minLat, minLon],
    northEast: [maxLat, maxLon],
  };
}
