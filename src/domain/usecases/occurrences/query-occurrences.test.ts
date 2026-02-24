import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import {
  filterOccurrences,
  isValidOccurrence,
  paginate,
} from "@/domain/usecases/occurrences/query-occurrences";

const fixtures: Occurrence[] = [
  { id: "1", label: "Onca", lat: -10, lon: -50 },
  { id: "2", label: "Lobo", lat: -11, lon: -51 },
  { id: "3", label: "Inv", lat: 999, lon: 0 },
];

describe("query-occurrences", () => {
  it("isValidOccurrence valida lat/lon", () => {
    expect(isValidOccurrence(fixtures[0]!)).toBe(true);
    expect(isValidOccurrence(fixtures[2]!)).toBe(false);
  });

  it("filterOccurrences filtra por label", () => {
    const result = filterOccurrences(fixtures, { query: "lobo", validity: "all" });
    expect(result.map((item) => item.id)).toEqual(["2"]);
  });

  it("filterOccurrences filtra por validade", () => {
    expect(filterOccurrences(fixtures, { query: "", validity: "valid" }).map((item) => item.id)).toEqual([
      "1",
      "2",
    ]);

    expect(filterOccurrences(fixtures, { query: "", validity: "invalid" }).map((item) => item.id)).toEqual([
      "3",
    ]);
  });

  it("paginate retorna página e total corretos", () => {
    const result = paginate([1, 2, 3, 4, 5], 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.totalItems).toBe(5);
  });
});
