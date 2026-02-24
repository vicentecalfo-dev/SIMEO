import type { Occurrence } from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

function isZeroZero(occurrence: Occurrence): boolean {
  return occurrence.lat === 0 && occurrence.lon === 0;
}

function isExportableOccurrence(occurrence: Occurrence): boolean {
  return validateLatLon(occurrence.lat, occurrence.lon).ok && !isZeroZero(occurrence);
}

function escapeCsvCell(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function exportOccurrencesCsv(occurrences: Occurrence[]): string {
  const header = "id,label,lat,lon,source";
  const lines = occurrences
    .filter(isExportableOccurrence)
    .map((occurrence) => {
      const row = [
        occurrence.id,
        occurrence.label ?? "",
        String(occurrence.lat),
        String(occurrence.lon),
        occurrence.source ?? "",
      ];

      return row.map((cell) => escapeCsvCell(cell)).join(",");
    });

  return [header, ...lines].join("\n");
}
