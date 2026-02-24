import type { Occurrence } from "@/domain/entities/occurrence";
import { validateLatLon } from "@/domain/value-objects/latlon";

export type OccurrenceValidityFilter = "all" | "valid" | "invalid";

export type QueryOccurrencesParams = {
  query: string;
  validity: OccurrenceValidityFilter;
};

export function isValidOccurrence(occurrence: Occurrence): boolean {
  return validateLatLon(occurrence.lat, occurrence.lon).ok;
}

export function filterOccurrences(
  occurrences: Occurrence[],
  params: QueryOccurrencesParams,
): Occurrence[] {
  const normalizedQuery = params.query.trim().toLowerCase();

  return occurrences.filter((occurrence) => {
    const valid = isValidOccurrence(occurrence);

    if (params.validity === "valid" && !valid) {
      return false;
    }

    if (params.validity === "invalid" && valid) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (occurrence.label ?? "").toLowerCase().includes(normalizedQuery);
  });
}

export function paginate<T>(
  list: T[],
  page: number,
  pageSize: number,
): {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
} {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: list.slice(start, start + safePageSize),
    page: safePage,
    totalPages,
    totalItems,
  };
}
