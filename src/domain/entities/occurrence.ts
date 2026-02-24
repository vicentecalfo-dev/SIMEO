import { validateLatLon } from "@/domain/value-objects/latlon";

export interface Occurrence {
  id: string;
  lat: number;
  lon: number;
  label?: string;
  source?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Estrutura auditável temporária da linha original.
  raw?: Record<string, any>;
}

function randomOccurrenceIdFallback(): string {
  return `occ-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateOccurrenceId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return randomOccurrenceIdFallback();
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
    const trimmed = input.label.trim();
    if (trimmed.length > 0) {
      normalized.label = trimmed;
    }
  }

  if (typeof input.source === "string" && input.source.trim().length > 0) {
    normalized.source = input.source.trim();
  }

  if (input.raw && typeof input.raw === "object") {
    normalized.raw = { ...input.raw };
  }

  return normalized;
}
