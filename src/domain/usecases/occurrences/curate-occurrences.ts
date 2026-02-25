import {
  normalizeCalcStatus,
  type Occurrence,
  type OccurrenceCalcStatus,
} from "@/domain/entities/occurrence";

export function addOccurrenceToList(
  occurrences: Occurrence[],
  occurrence: Occurrence,
): Occurrence[] {
  return [...occurrences, occurrence];
}

export function updateOccurrenceById(
  occurrences: Occurrence[],
  id: string,
  patch: Partial<Occurrence>,
): Occurrence[] {
  return occurrences.map((occurrence) =>
    occurrence.id === id ? { ...occurrence, ...patch, id: occurrence.id } : occurrence,
  );
}

export function deleteOccurrenceById(
  occurrences: Occurrence[],
  id: string,
): Occurrence[] {
  return occurrences.filter((occurrence) => occurrence.id !== id);
}

export function toggleOccurrenceCalcStatusById(
  occurrences: Occurrence[],
  id: string,
): Occurrence[] {
  return occurrences.map((occurrence) => {
    if (occurrence.id !== id) {
      return occurrence;
    }

    const currentStatus = normalizeCalcStatus(occurrence.calcStatus);
    const nextStatus: OccurrenceCalcStatus =
      currentStatus === "enabled" ? "disabled" : "enabled";

    return {
      ...occurrence,
      calcStatus: nextStatus,
    };
  });
}
