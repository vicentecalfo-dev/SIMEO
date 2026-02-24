import { validateLatLon } from "@/domain/value-objects/latlon";

export interface Occurrence {
  id: string;
  lat: number;
  lon: number;
  label?: string;
}

function generateOccurrenceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `occ-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeOccurrence(
  input: Partial<Occurrence>,
): Occurrence | null {
  if (typeof input.lat !== "number" || typeof input.lon !== "number") {
    return null;
  }

  const validCoords = validateLatLon(input.lat, input.lon);
  if (!validCoords.ok) {
    return null;
  }

  const normalizedId =
    typeof input.id === "string" && input.id.trim().length > 0
      ? input.id.trim()
      : generateOccurrenceId();

  const normalized: Occurrence = {
    id: normalizedId,
    lat: input.lat,
    lon: input.lon,
  };

  if (typeof input.label === "string") {
    normalized.label = input.label.trim();
  }

  return normalized;
}
