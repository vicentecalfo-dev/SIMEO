import { describe, expect, it } from "vitest";
import type { Occurrence } from "@/domain/entities/occurrence";
import {
  dedupeOccurrences,
  removeInvalid,
} from "@/domain/usecases/occurrences/clean-occurrences";

function occ(data: Partial<Occurrence>): Occurrence {
  return {
    id: data.id ?? "occ-1",
    lat: data.lat ?? -22.9,
    lon: data.lon ?? -43.2,
    label: data.label,
    source: data.source,
    raw: data.raw,
  };
}

describe("clean-occurrences", () => {
  it("removeInvalid remove inválidos", () => {
    const occurrences: Occurrence[] = [
      occ({ id: "1", lat: -22.9, lon: -43.2 }),
      occ({ id: "2", lat: 0, lon: 0 }),
      occ({ id: "3", lat: 91, lon: -40 }),
    ];

    const result = removeInvalid(occurrences);

    expect(result.kept).toHaveLength(1);
    expect(result.removedCount).toBe(2);
  });

  it("dedupeOccurrences remove duplicados conforme regra", () => {
    const occurrences: Occurrence[] = [
      occ({ id: "1", lat: -22.9, lon: -43.2, label: "A" }),
      occ({ id: "2", lat: -22.90000001, lon: -43.20000001, label: "A" }),
      occ({ id: "3", lat: -22.9, lon: -43.2, label: "B" }),
    ];

    const result = dedupeOccurrences(occurrences);

    expect(result.kept).toHaveLength(2);
    expect(result.removedCount).toBe(1);
  });
});
