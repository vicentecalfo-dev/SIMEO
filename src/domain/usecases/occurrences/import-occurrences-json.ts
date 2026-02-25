import {
  DEFAULT_OCCURRENCE_CALC_STATUS,
  generateOccurrenceId,
  normalizeOccurrence,
  type Occurrence,
} from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";
import { dedupeOccurrences } from "@/domain/usecases/occurrences/clean-occurrences";
import { parseCoordinate, type ImportCsvResult } from "@/domain/usecases/occurrences/import-occurrences-csv";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRawRecord(value: unknown): Record<string, unknown> {
  if (!isObject(value)) {
    return {};
  }

  return { ...value };
}

function toOccurrenceFromSimpleObject(item: JsonObject): Partial<Occurrence> {
  const id = typeof item.id === "string" ? item.id : undefined;
  const label = typeof item.label === "string" ? item.label : undefined;

  return {
    id,
    label,
    lat: parseCoordinate(item.lat),
    lon: parseCoordinate(item.lon),
    source: "json",
    calcStatus: DEFAULT_OCCURRENCE_CALC_STATUS,
    raw: toRawRecord(item),
  };
}

function toOccurrenceFromGeoJsonFeature(feature: JsonObject): Partial<Occurrence> {
  const properties = isObject(feature.properties) ? feature.properties : {};
  const geometry = isObject(feature.geometry) ? feature.geometry : {};
  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];

  const lon = coordinates[0];
  const lat = coordinates[1];

  return {
    id: typeof properties.id === "string" ? properties.id : undefined,
    label: typeof properties.label === "string" ? properties.label : undefined,
    lat: parseCoordinate(lat),
    lon: parseCoordinate(lon),
    source: "json",
    calcStatus: DEFAULT_OCCURRENCE_CALC_STATUS,
    raw: {
      feature,
    },
  };
}

function mapCandidatesToResult(candidates: Partial<Occurrence>[]): ImportCsvResult {
  const invalidRows: Array<{ index: number; reason: string }> = [];
  const validCandidates: Occurrence[] = [];

  let invalid = 0;
  let zeroZero = 0;

  candidates.forEach((candidate, index) => {
    const lat = typeof candidate.lat === "number" ? candidate.lat : Number.NaN;
    const lon = typeof candidate.lon === "number" ? candidate.lon : Number.NaN;

    const validation = validateLatLon(lat, lon);
    if (!validation.ok) {
      invalid += 1;
      if (validation.reason === "zero-zero") {
        zeroZero += 1;
      }

      invalidRows.push({
        index: index + 1,
        reason: validation.reason,
      });
      return;
    }

    const normalized = normalizeOccurrence({
      ...candidate,
      id: candidate.id ?? generateOccurrenceId(),
      lat,
      lon,
    });

    if (!normalized) {
      invalid += 1;
      invalidRows.push({
        index: index + 1,
        reason: "invalid-occurrence",
      });
      return;
    }

    validCandidates.push(normalized);
  });

  const deduped = dedupeOccurrences(validCandidates);

  return {
    imported: deduped.kept,
    stats: {
      rows: candidates.length,
      valid: deduped.kept.length,
      invalid,
      zeroZero,
      deduped: deduped.removedCount,
    },
    invalidRows,
  };
}

export function importOccurrencesFromJson(
  input: unknown,
): ImportCsvResult {
  if (Array.isArray(input)) {
    const candidates = input.map((item) => {
      if (isObject(item)) {
        return toOccurrenceFromSimpleObject(item);
      }

      return {
        lat: Number.NaN,
        lon: Number.NaN,
        source: "json",
        calcStatus: DEFAULT_OCCURRENCE_CALC_STATUS,
        raw: { value: item },
      };
    });

    return mapCandidatesToResult(candidates);
  }

  if (isObject(input) && input.type === "FeatureCollection") {
    const features = Array.isArray(input.features) ? input.features : [];
    const candidates = features
      .filter((feature): feature is JsonObject => isObject(feature))
      .filter((feature) => {
        const geometry = isObject(feature.geometry) ? feature.geometry : {};
        return geometry.type === "Point";
      })
      .map((feature) => toOccurrenceFromGeoJsonFeature(feature));

    return mapCandidatesToResult(candidates);
  }

  throw new Error("json inválido");
}

export async function importOccurrencesJsonFile(file: File): Promise<ImportCsvResult> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  return importOccurrencesFromJson(parsed);
}
