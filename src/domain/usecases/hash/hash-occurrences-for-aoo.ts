import type { Occurrence } from "@/domain/entities/occurrence";
import { round } from "@/lib/math";
import { selectOccurrencesForCompute } from "@/domain/usecases/occurrences/select-occurrences-for-compute";

type NormalizedOccurrenceHashInput = {
  lat: number;
  lon: number;
  label: string;
};

function normalizeLabel(label: string | undefined): string {
  return (label ?? "").trim();
}

function normalizeOccurrence(
  occurrence: Occurrence,
): NormalizedOccurrenceHashInput {
  return {
    lat: round(occurrence.lat, 6),
    lon: round(occurrence.lon, 6),
    label: normalizeLabel(occurrence.label),
  };
}

function compareNormalizedOccurrences(
  left: NormalizedOccurrenceHashInput,
  right: NormalizedOccurrenceHashInput,
): number {
  if (left.lat !== right.lat) {
    return left.lat - right.lat;
  }

  if (left.lon !== right.lon) {
    return left.lon - right.lon;
  }

  if (left.label < right.label) {
    return -1;
  }

  if (left.label > right.label) {
    return 1;
  }

  return 0;
}

function encodeLabel(label: string): string {
  return label
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "\\n");
}

function fnv1a32(text: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function hashOccurrencesForAOO(
  occurrences: Occurrence[],
  cellSizeMeters: number,
): string {
  const canonicalRows = selectOccurrencesForCompute(occurrences)
    .map((occurrence) => normalizeOccurrence(occurrence))
    .sort(compareNormalizedOccurrences)
    .map(
      (occurrence) =>
        `${occurrence.lat.toFixed(6)}|${occurrence.lon.toFixed(6)}|${encodeLabel(occurrence.label)}`,
    );

  const normalizedCellSize = round(cellSizeMeters, 6).toFixed(6);
  return fnv1a32(`cellSizeMeters=${normalizedCellSize}\n${canonicalRows.join("\n")}`);
}
