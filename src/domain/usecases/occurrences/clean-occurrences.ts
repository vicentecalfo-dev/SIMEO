import type { Occurrence } from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { round } from "@/lib/math";

function normalizeLabel(value: string | undefined): string {
  return (value ?? "").trim();
}

export function buildOccurrenceDedupeKey(occurrence: Occurrence): string {
  return `${round(occurrence.lat, 6)}|${round(occurrence.lon, 6)}|${normalizeLabel(occurrence.label)}`;
}

export function removeInvalid(occurrences: Occurrence[]): {
  kept: Occurrence[];
  removedCount: number;
} {
  const kept = occurrences.filter((occurrence) =>
    validateLatLon(occurrence.lat, occurrence.lon).ok,
  );

  return {
    kept,
    removedCount: occurrences.length - kept.length,
  };
}

export function dedupeOccurrences(occurrences: Occurrence[]): {
  kept: Occurrence[];
  removedCount: number;
} {
  const seen = new Set<string>();
  const kept: Occurrence[] = [];

  for (const occurrence of occurrences) {
    const key = buildOccurrenceDedupeKey(occurrence);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    kept.push(occurrence);
  }

  return {
    kept,
    removedCount: occurrences.length - kept.length,
  };
}
