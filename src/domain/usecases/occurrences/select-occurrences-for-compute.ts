import {
  isOccurrenceEnabledForCompute,
  type Occurrence,
} from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

export function selectOccurrencesForCompute(
  occurrences: Occurrence[],
): Occurrence[] {
  return occurrences.filter(
    (occurrence) =>
      isOccurrenceEnabledForCompute(occurrence) &&
      validateLatLon(occurrence.lat, occurrence.lon).ok,
  );
}
